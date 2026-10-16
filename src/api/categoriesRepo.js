import db from './sqLiteClient';

// Get all categories
export function getAllCategories() {
  return db.getAllSync('SELECT * FROM categories ORDER BY type ASC, name ASC');
}

// Get categories by type
export function getCategoriesByType(type) {
  return db.getAllSync('SELECT * FROM categories WHERE type = ? ORDER BY name ASC', [type]);
}

// Create category
export function createCategory({ name, type, color = '#A78BFA' }) {
  return db.runSync(
    'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)',
    [name.trim(), type, color]
  );
}

// Update category
export function updateCategory(id, { name, color }) {
  return db.runSync(
    'UPDATE categories SET name = ?, color = ? WHERE id = ?',
    [name.trim(), color, id]
  );
}

// Delete category
export function deleteCategory(id) {
  return db.withTransactionSync(() => {
    db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  });
}

// Check how many transactions are tied to a category
export function getCategoryTransactionCount(categoryId) {
  const result = db.getFirstSync(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?', 
    [categoryId]
  );
  return result?.count || 0;
}