CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_nocase
ON categories(name COLLATE NOCASE);
