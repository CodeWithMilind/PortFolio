const express = require('express');
const { db } = require('../config/database');

const router = express.Router();
const orderedTables = ['education', 'experience', 'categories', 'certifications', 'awards', 'skills'];

router.get('/profile', (req, res, next) => {
  try { return res.json(db.prepare('SELECT * FROM profile ORDER BY id DESC LIMIT 1').get() || null); }
  catch (error) { return next(error); }
});

for (const table of orderedTables) {
  router.get(`/${table}`, (req, res, next) => {
    try { return res.json(db.prepare(`SELECT * FROM ${table} ORDER BY display_order, id`).all()); }
    catch (error) { return next(error); }
  });
}

router.get('/projects', (req, res, next) => {
  try {
    const category = String(req.query.category || '').trim();
    const sql = `SELECT p.*, c.name AS category_name FROM projects p
      LEFT JOIN categories c ON c.id = p.category_id
      ${category ? 'WHERE (LOWER(c.name) = LOWER(?) OR CAST(c.id AS TEXT) = ?)' : ''}
      ORDER BY p.display_order, p.id`;
    const projects = category ? db.prepare(sql).all(category, category) : db.prepare(sql).all();
    return res.json(projects.map((project) => {
      try { return { ...project, technologies: JSON.parse(project.technologies || '[]') }; }
      catch { return { ...project, technologies: [] }; }
    }));
  } catch (error) { return next(error); }
});

router.get('/site-settings', (req, res, next) => {
  try {
    const settings = {};
    db.prepare('SELECT key, value FROM site_settings ORDER BY key').all().forEach((row) => { settings[row.key] = row.value; });
    return res.json(settings);
  } catch (error) { return next(error); }
});

module.exports = router;
