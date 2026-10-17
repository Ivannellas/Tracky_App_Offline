import db from './sqLiteClient';

// Get all categories
export function getAllCategories() {
  return db.getAllSync('SELECT * FROM categories ORDER BY type ASC, name ASC');
}

// Get categories by type
export function getCategoriesByType(type) {
  return db.getAllSync('SELECT * FROM categories WHERE type = ? ORDER BY name ASC', [type]);
}

// Create category with optional budget_limit
export function createCategory({ name, type, color = '#A78BFA', budget_limit = 0 }) {
  return db.runSync(
    'INSERT INTO categories (name, type, color, budget_limit) VALUES (?, ?, ?, ?)',
    [name.trim(), type, color, budget_limit]
  );
}

// Update category details (name, color, optional budget_limit)
export function updateCategory(id, { name, color, budget_limit = 0 }) {
  return db.runSync(
    'UPDATE categories SET name = ?, color = ?, budget_limit = ? WHERE id = ?',
    [name.trim(), color, budget_limit, id]
  );
}

// Dedicated function to update category budget limit directly
export function updateCategoryBudget(categoryId, budgetLimit) {
  return db.runSync(
    'UPDATE categories SET budget_limit = ? WHERE id = ?',
    [budgetLimit, categoryId]
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