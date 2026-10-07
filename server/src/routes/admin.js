const express = require('express');
const { db } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { parsePositiveInt } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth);

const definitions = {
  education: { required: ['degree', 'institution'], fields: ['degree', 'institution', 'start_date', 'end_date', 'description', 'display_order'] },
  experience: { required: ['company', 'position'], fields: ['company', 'position', 'start_date', 'end_date', 'description', 'display_order'] },
  categories: { required: ['name'], fields: ['name', 'display_order'] },
  projects: { required: ['title', 'category_id'], fields: ['title', 'description', 'category_id', 'technologies', 'github_url', 'live_url', 'image_path', 'display_order'] },
  certifications: { required: ['title', 'issuer'], fields: ['title', 'issuer', 'issue_date', 'certificate_url', 'image_path', 'display_order'] },
  awards: { required: ['title', 'organization'], fields: ['title', 'organization', 'award_date', 'description', 'url', 'image_path', 'display_order'] },
  skills: { required: ['category', 'name'], fields: ['category', 'name', 'display_order'] },
};
const orderBy = 'display_order ASC, id ASC';
const errorJson = (res, status, error) => res.status(status).json({ error });
const validId = (value) => parsePositiveInt(value, null);
const decodeRow = (table, row) => {
  if (table !== 'projects' || !row) return row;
  try { return { ...row, technologies: JSON.parse(row.technologies || '[]') }; }
  catch { return { ...row, technologies: [] }; }
};

function normalize(table, body) {
  const def = definitions[table];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'A JSON object is required.' };
  const row = {};
  for (const field of def.fields) {
    if (!(field in body)) continue;
    let value = body[field];
    if (field === 'category_id') {
      value = validId(value);
      if (value === null) return { error: 'Valid category_id is required.' };
    } else if (field === 'display_order') {
      value = Number(value);
      if (!Number.isInteger(value)) return { error: 'display_order must be an integer.' };
    } else if (field === 'technologies') {
      if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) return { error: 'technologies must be an array of strings.' };
      value = JSON.stringify(value);
    } else if (value !== null && typeof value !== 'string') {
      return { error: `${field} must be a string or null.` };
    } else if (typeof value === 'string') value = value.trim();
    if (typeof value === 'string' && /(?:^|_)(?:url)$/.test(field) && value) {
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) return { error: `${field} must use HTTP or HTTPS.` };
      } catch { return { error: `${field} is invalid.` }; }
    }
    if (typeof value === 'string' && /(?:^|_)(?:date)$/.test(field) && value && Number.isNaN(Date.parse(value))) {
      return { error: `${field} is invalid.` };
    }
    row[field] = value;
  }
  for (const field of def.required) {
    if (!(field in row) || (typeof row[field] === 'string' && !row[field])) return { error: `${field} is required.` };
  }
  return { row };
}

router.get('/profile', (req, res, next) => {
  try { return res.json(db.prepare('SELECT * FROM profile ORDER BY id DESC LIMIT 1').get() || null); }
  catch (error) { return next(error); }
});
router.put('/profile', (req, res, next) => {
  try {
    const fields = ['name', 'title', 'email', 'phone', 'location', 'github_url', 'linkedin_url', 'whatsapp_url', 'profile_image_path', 'cv_file_path'];
    const body = req.body || {};
    if (typeof body.name !== 'string' || !body.name.trim()) return errorJson(res, 400, 'name is required.');
    const row = Object.fromEntries(fields.map((field) => [field, field === 'name' ? body.name.trim() : (typeof body[field] === 'string' ? body[field].trim() : null)]));
    const existing = db.prepare('SELECT id FROM profile ORDER BY id DESC LIMIT 1').get();
    if (!existing) {
      const cols = fields.join(', ');
      const result = db.prepare(`INSERT INTO profile (${cols}) VALUES (${fields.map(() => '?').join(', ')})`).run(...fields.map((field) => row[field]));
      return res.status(201).json(db.prepare('SELECT * FROM profile WHERE id = ?').get(result.lastInsertRowid));
    }
    db.prepare(`UPDATE profile SET ${fields.map((field) => `${field} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...fields.map((field) => row[field]), existing.id);
    return res.json(db.prepare('SELECT * FROM profile WHERE id = ?').get(existing.id));
  } catch (error) { return next(error); }
});

for (const [table, def] of Object.entries(definitions)) {
  router.get(`/${table}`, (req, res, next) => {
    try {
      const query = table === 'projects'
        ? 'SELECT projects.*, categories.name AS category_name FROM projects LEFT JOIN categories ON categories.id = projects.category_id ORDER BY projects.display_order, projects.id'
        : `SELECT * FROM ${table} ORDER BY ${orderBy}`;
      return res.json(db.prepare(query).all().map((row) => decodeRow(table, row)));
    }
    catch (error) { return next(error); }
  });
  router.post(`/${table}`, (req, res, next) => {
    try {
      const { row, error } = normalize(table, req.body);
      if (error) return errorJson(res, 400, error);
      if (table === 'projects' && !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(row.category_id)) return errorJson(res, 400, 'category_id does not exist.');
      const keys = Object.keys(row);
      const result = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...keys.map((key) => row[key]));
      return res.status(201).json(decodeRow(table, db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(result.lastInsertRowid)));
    } catch (err) { return err.code === 'SQLITE_CONSTRAINT_UNIQUE' ? errorJson(res, 400, 'A record with that unique value already exists.') : next(err); }
  });
  router.put(`/${table}/:id`, (req, res, next) => {
    try {
      const id = validId(req.params.id);
      if (!id) return errorJson(res, 400, 'Invalid ID.');
      if (!db.prepare(`SELECT 1 FROM ${table} WHERE id = ?`).get(id)) return errorJson(res, 404, `${table} record not found.`);
      const { row, error } = normalize(table, req.body);
      if (error) return errorJson(res, 400, error);
      if (table === 'projects' && !db.prepare('SELECT 1 FROM categories WHERE id = ?').get(row.category_id)) return errorJson(res, 400, 'category_id does not exist.');
      const keys = Object.keys(row);
      db.prepare(`UPDATE ${table} SET ${keys.map((key) => `${key} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...keys.map((key) => row[key]), id);
      return res.json(decodeRow(table, db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)));
    } catch (err) { return err.code === 'SQLITE_CONSTRAINT_UNIQUE' ? errorJson(res, 400, 'A record with that unique value already exists.') : next(err); }
  });
  router.delete(`/${table}/:id`, (req, res, next) => {
    try {
      const id = validId(req.params.id);
      if (!id) return errorJson(res, 400, 'Invalid ID.');
      const record = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
      if (!record) return errorJson(res, 404, `${table} record not found.`);
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      return res.json({ success: true, deleted: record });
    } catch (err) {
      if (table === 'categories' && err.code && err.code.startsWith('SQLITE_CONSTRAINT') && /foreign key/i.test(err.message)) {
        return errorJson(res, 400, 'Cannot delete category while projects reference it.');
      }
      return next(err);
    }
  });
}

router.get('/site-settings', (req, res, next) => {
  try { return res.json(db.prepare('SELECT * FROM site_settings ORDER BY key').all()); }
  catch (error) { return next(error); }
});
router.put('/site-settings/:key', (req, res, next) => {
  try {
    const key = String(req.params.key || '').trim();
    if (!key) return errorJson(res, 400, 'Setting key is required.');
    const value = req.body && req.body.value != null ? String(req.body.value) : null;
    db.prepare(`INSERT INTO site_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`).run(key, value);
    return res.json(db.prepare('SELECT * FROM site_settings WHERE key = ?').get(key));
  } catch (error) { return next(error); }
});
router.delete('/site-settings/:key', (req, res, next) => {
  try {
    const key = String(req.params.key || '').trim();
    const record = db.prepare('SELECT * FROM site_settings WHERE key = ?').get(key);
    if (!record) return errorJson(res, 404, 'Site setting not found.');
    db.prepare('DELETE FROM site_settings WHERE key = ?').run(key);
    return res.json({ success: true, deleted: record });
  } catch (error) { return next(error); }
});

module.exports = router;
