const fs = require('fs');
const path = require('path');
const { db } = require('../src/config/database');

const projectRoot = path.resolve(__dirname, '../../');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(projectRoot, file), 'utf8'));
const relativeAssetPath = (value) => value ? value.replace(/^\.\//, '') : null;

function prepareImport() {
  const projects = readJson('assets/data/projects.json');
  const certificates = readJson('assets/data/certificates.json');
  const categories = [...new Map(projects.map((p) => {
    const name = String(p.displayCategory || p.category || '').trim();
    return [name.toLowerCase(), name];
  }).filter(([key, name]) => key && name)).values()];
  const preparedProjects = projects.map((project) => ({
    title: String(project.title || '').trim(), description: project.description || null,
    category: String(project.displayCategory || project.category || '').trim(),
    technologies: JSON.stringify(Array.isArray(project.technologies) ? project.technologies : []),
    github_url: project.link || null, image_path: relativeAssetPath(project.image),
    display_order: Number(project.display_order) || 0,
  }));
  const preparedCertificates = certificates.map((certificate) => ({
    title: String(certificate.title || '').trim(), issuer: String(certificate.issuer || '').trim(),
    certificate_url: certificate.link || null, image_path: relativeAssetPath(certificate.image), display_order: 0,
  }));
  return { categories, projects: preparedProjects, certificates: preparedCertificates };
}

function importData(data) {
  const importTransaction = db.transaction(() => {
    const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
    const getCategory = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE');
    for (const name of data.categories) insertCategory.run(name);
    let addedProjects = 0;
    const existsProject = db.prepare('SELECT 1 FROM projects WHERE title = ? COLLATE NOCASE');
    const addProject = db.prepare(`INSERT INTO projects
      (title, description, category_id, technologies, github_url, image_path, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (const project of data.projects) {
      if (existsProject.get(project.title)) continue;
      const category = getCategory.get(project.category);
      if (!category) throw new Error(`Could not resolve category for ${project.title}`);
      addProject.run(project.title, project.description, category.id, project.technologies, project.github_url, project.image_path, project.display_order);
      addedProjects += 1;
    }
    let addedCertificates = 0;
    const existsCertificate = db.prepare('SELECT 1 FROM certifications WHERE title = ? COLLATE NOCASE AND issuer = ? COLLATE NOCASE');
    const addCertificate = db.prepare(`INSERT INTO certifications
      (title, issuer, certificate_url, image_path, display_order) VALUES (?, ?, ?, ?, ?)`);
    for (const certificate of data.certificates) {
      if (existsCertificate.get(certificate.title, certificate.issuer)) continue;
      addCertificate.run(certificate.title, certificate.issuer, certificate.certificate_url, certificate.image_path, certificate.display_order);
      addedCertificates += 1;
    }
    return { addedProjects, addedCertificates };
  });
  return importTransaction();
}

try {
  const data = prepareImport();
  const apply = process.argv.includes('--apply');
  console.log(`Projects: ${data.projects.length}; certificates: ${data.certificates.length}; categories: ${data.categories.length}.`);
  if (!apply || process.argv.includes('--dry-run')) {
    console.log('Dry run complete. No database records were changed. Use --apply to insert missing records.');
  } else {
    console.log(`Imported ${JSON.stringify(importData(data))}. Existing matching records were kept unchanged.`);
  }
} catch (error) {
  console.error(`Legacy import failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  db.close();
}
