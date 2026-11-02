import db from './sqLiteClient';

// Get all categories
export function getAllCategories() {
  return db.getAllSync('SELECT * FROM categories ORDER BY type ASC, name ASC');
}

// Get categories by type
export function getCategoriesByType(type) {
  return db.getAllSync('SELECT * FROM categories WHERE type = ? ORDER BY name ASC', [type]);
}

// Create/Add category
export function addCategory({ name, type, color = '#8B5CF6', icon = 'pricetag-outline', budget_limit = 0 }) {
  return db.runSync(
    'INSERT INTO categories (name, type, color, icon, budget_limit) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), type, color, icon, budget_limit]
  );
}

// Keep createCategory as an alias just in case
export function createCategory(data) {
  return addCategory(data);
}

// Update category details
export function updateCategory(id, { name, icon, color, type, budget_limit = 0 }) {
  return db.runSync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, type = ?, budget_limit = ? WHERE id = ?',
    [name.trim(), icon, color, type, budget_limit, id]
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