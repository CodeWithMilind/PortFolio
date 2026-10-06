const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { db } = require('../config/database');
const { env } = require('../config/env');
const { requireAuth } = require('../middleware/auth');
const { parsePositiveInt } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth);

const imageTypes = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);
const mimeExtensions = new Map([
  ['image/jpeg', new Set(['.jpg', '.jpeg'])],
  ['image/png', new Set(['.png'])],
  ['image/webp', new Set(['.webp'])],
  ['application/pdf', new Set(['.pdf'])],
]);
const specifications = {
  project: { bucket: 'projects', table: 'projects', column: 'image_path', idFields: ['project_id', 'record_id'], allowed: imageTypes, maxBytes: 5 * 1024 * 1024 },
  certificate: { bucket: 'certificates', table: 'certifications', column: 'image_path', idFields: ['certification_id', 'certificate_id', 'record_id'], allowed: imageTypes, maxBytes: 5 * 1024 * 1024 },
  award: { bucket: 'awards', table: 'awards', column: 'image_path', idFields: ['award_id', 'record_id'], allowed: imageTypes, maxBytes: 5 * 1024 * 1024 },
  profile: { bucket: 'profile', table: 'profile', column: 'profile_image_path', latest: true, allowed: imageTypes, maxBytes: 5 * 1024 * 1024 },
  cv: { bucket: 'cv', table: 'profile', column: 'cv_file_path', latest: true, allowed: new Map([['.pdf', 'application/pdf']]), maxBytes: 10 * 1024 * 1024 },
};

class UploadProblem extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const receivers = Object.fromEntries(Object.entries(specifications).map(([kind, spec]) => [kind, multer({
  storage: multer.memoryStorage(),
  preservePath: true,
  limits: { files: 1, fileSize: spec.maxBytes, fields: 8, fieldSize: 16 * 1024, parts: 9 },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname || '').toLowerCase();
    if (!spec.allowed.has(extension)) return callback(new UploadProblem(415, 'Unsupported file type.'));
    if (mimeExtensions.get(file.mimetype)?.has(extension) !== true) return callback(new UploadProblem(415, 'File content type does not match an allowed type.'));
    callback(null, true);
  },
}).single('file')]));

function receiveFile(req, res, next) {
  receivers[req.params.kind](req, res, (error) => {
    if (!error) return next();
    if (error instanceof UploadProblem) return res.status(error.status).json({ error: error.message });
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File exceeds the upload size limit.' });
    if (error.code && error.code.startsWith('LIMIT_')) return res.status(400).json({ error: 'Invalid upload request.' });
    return res.status(400).json({ error: 'Could not read uploaded file.' });
  });
}

function contentMatches(extension, buffer) {
  if (extension === '.jpg' || extension === '.jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (extension === '.png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (extension === '.webp') {
    return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  if (extension === '.pdf') return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  return false;
}

function validOriginalName(name) {
  return typeof name === 'string' && name.length > 0 && !/[\\/\0]/.test(name) && !name.includes('..') && !path.isAbsolute(name);
}

function resolveInside(root, child) {
  const absoluteRoot = path.resolve(root);
  const absoluteChild = path.resolve(absoluteRoot, child);
  const relative = path.relative(absoluteRoot, absoluteChild);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) return null;
  return absoluteChild;
}

function getRecord(spec, req) {
  if (spec.latest) return db.prepare('SELECT id, ' + spec.column + ' AS stored_path FROM profile ORDER BY id DESC LIMIT 1').get() || null;
  const rawId = spec.idFields.map((field) => req.body && req.body[field]).find((value) => value !== undefined && value !== '');
  const id = parsePositiveInt(rawId, null);
  if (!id) throw new UploadProblem(400, 'A valid record ID is required.');
  return db.prepare(`SELECT id, ${spec.column} AS stored_path FROM ${spec.table} WHERE id = ?`).get(id) || null;
}

function managedOldFile(spec, relativePath) {
  if (typeof relativePath !== 'string') return null;
  const match = /^uploads\/(projects|certificates|awards|profile|cv)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|jpeg|png|webp|pdf)$/i.exec(relativePath.replace(/\\/g, '/'));
  if (!match || match[1] !== spec.bucket) return null;
  const extension = `.${match[3].toLowerCase()}`;
  if (!spec.allowed.has(extension)) return null;
  return resolveInside(env.uploadDir, path.join(spec.bucket, `${match[2]}${extension}`));
}

async function saveUpload(spec, file) {
  const root = path.resolve(env.uploadDir);
  const bucketPath = resolveInside(root, spec.bucket);
  if (!bucketPath) throw new UploadProblem(500, 'Upload storage is unavailable.');
  await fs.promises.mkdir(bucketPath, { recursive: true });
  const realRoot = await fs.promises.realpath(root);
  const realBucket = await fs.promises.realpath(bucketPath);
  if (!resolveInside(realRoot, path.relative(realRoot, realBucket))) throw new UploadProblem(500, 'Upload storage is unavailable.');

  const extension = path.extname(file.originalname).toLowerCase();
  const filename = `${crypto.randomUUID()}${extension}`;
  const absolutePath = resolveInside(realBucket, filename);
  if (!absolutePath) throw new UploadProblem(500, 'Upload storage is unavailable.');
  const handle = await fs.promises.open(absolutePath, 'wx', 0o644);
  try {
    await handle.writeFile(file.buffer);
    await handle.close();
  } catch (error) {
    await handle.close().catch(() => {});
    await fs.promises.unlink(absolutePath).catch(() => {});
    throw error;
  }
  return { absolutePath, relativePath: path.posix.join('uploads', spec.bucket, filename) };
}

async function removeNewFile(absolutePath) {
  if (!absolutePath) return;
  try { await fs.promises.unlink(absolutePath); }
  catch { console.error('Failed to remove an unassociated uploaded file.'); }
}

async function deleteOldFile(spec, relativePath) {
  const oldPath = managedOldFile(spec, relativePath);
  if (!oldPath) return;
  try {
    const [realRoot, realBucket] = await Promise.all([
      fs.promises.realpath(env.uploadDir),
      fs.promises.realpath(path.join(env.uploadDir, spec.bucket)),
    ]);
    const expectedBucket = path.resolve(realRoot, spec.bucket);
    const normalize = (value) => process.platform === 'win32' ? value.toLowerCase() : value;
    if (normalize(realBucket) !== normalize(expectedBucket)) throw new Error('Upload directory changed.');
    const actual = await fs.promises.lstat(oldPath);
    if (actual.isSymbolicLink() || !actual.isFile()) throw new Error('Managed file is not a regular file.');
    await fs.promises.unlink(oldPath);
  } catch {
    console.error('An old uploaded file could not be removed after replacement.');
  }
}

async function handleUpload(req, res) {
  const spec = specifications[req.params.kind];
  let saved = null;
  try {
    if (!req.file) throw new UploadProblem(400, 'A file field named "file" is required.');
    if (!validOriginalName(req.file.originalname)) throw new UploadProblem(400, 'Invalid filename.');
    const extension = path.extname(req.file.originalname).toLowerCase();
    if (!contentMatches(extension, req.file.buffer)) throw new UploadProblem(415, 'File content does not match its declared type.');

    const record = getRecord(spec, req);
    if (!record) throw new UploadProblem(404, 'The target record was not found.');

    saved = await saveUpload(spec, req.file);
    const update = db.transaction(() => {
      const current = db.prepare(`SELECT id, ${spec.column} AS stored_path FROM ${spec.table} WHERE id = ?`).get(record.id);
      if (!current) throw new UploadProblem(404, 'The target record was not found.');
      const result = db.prepare(`UPDATE ${spec.table} SET ${spec.column} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(saved.relativePath, record.id);
      if (result.changes !== 1) throw new Error('Upload association was not saved.');
      return current.stored_path;
    });
    const oldPath = update();
    await deleteOldFile(spec, oldPath);
    return res.status(201).json({ success: true, path: saved.relativePath });
  } catch (error) {
    if (saved) await removeNewFile(saved.absolutePath);
    if (error instanceof UploadProblem) return res.status(error.status).json({ error: error.message });
    console.error('Upload could not be associated with its database record.');
    return res.status(500).json({ error: 'Upload could not be saved.' });
  }
}

router.post('/:kind', (req, res, next) => {
  if (!Object.prototype.hasOwnProperty.call(specifications, req.params.kind)) return res.status(404).json({ error: 'Upload endpoint not found.' });
  return receiveFile(req, res, next);
}, handleUpload);

module.exports = { router, specifications };
