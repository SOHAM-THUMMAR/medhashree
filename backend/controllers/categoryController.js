const CategoryModel = require('../models/categoryModel');
const { success, error } = require('../utils/apiResponse');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await CategoryModel.getAll();
    return success(res, categories, 'Categories fetched successfully');
  } catch (err) {
    console.error('Get Categories Error:', err);
    return error(res, 'Failed to fetch categories', 500);
  }
};

// @desc    Get subjects for a category
// @route   GET /api/categories/:id/subjects
// @access  Public
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await CategoryModel.getSubjects(req.params.id);
    return success(res, subjects, 'Subjects fetched successfully');
  } catch (err) {
    console.error('Get Subjects Error:', err);
    return error(res, 'Failed to fetch subjects', 500);
  }
};

// @desc    Get topics for a subject
// @route   GET /api/subjects/:id/topics
// @access  Public
exports.getTopics = async (req, res) => {
  try {
    const topics = await CategoryModel.getTopics(req.params.id);
    return success(res, topics, 'Topics fetched successfully');
  } catch (err) {
    console.error('Get Topics Error:', err);
    return error(res, 'Failed to fetch topics', 500);
  }
};

// @desc    Get micro topics for a topic
// @route   GET /api/topics/:id/micro-topics
// @access  Public
exports.getMicroTopics = async (req, res) => {
  try {
    const microTopics = await CategoryModel.getMicroTopics(req.params.id);
    return success(res, microTopics, 'Micro topics fetched successfully');
  } catch (err) {
    console.error('Get Micro Topics Error:', err);
    return error(res, 'Failed to fetch micro topics', 500);
  }
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Admin
exports.createCategory = async (req, res) => {
  try {
    const category = await CategoryModel.create(req.body);
    return success(res, category, 'Category created successfully', 201);
  } catch (err) {
    console.error('Create Category Error:', err);
    return error(res, 'Failed to create category', 500);
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Admin
exports.updateCategory = async (req, res) => {
  try {
    const category = await CategoryModel.update(req.params.id, req.body);
    if (!category) {
      return error(res, 'Category not found or no changes provided', 404);
    }
    return success(res, category, 'Category updated successfully');
  } catch (err) {
    console.error('Update Category Error:', err);
    return error(res, 'Failed to update category', 500);
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Admin
exports.deleteCategory = async (req, res) => {
  try {
    await CategoryModel.delete(req.params.id);
    return success(res, null, 'Category deleted successfully');
  } catch (err) {
    console.error('Delete Category Error:', err);
    return error(res, 'Failed to delete category (may be in use)', 500);
  }
};