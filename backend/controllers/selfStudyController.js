const SelfStudyModel = require('../models/selfStudyModel');
const { success, error } = require('../utils/apiResponse');

// @desc    Get all self study paths
// @route   GET /api/self-study
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await SelfStudyModel.getAll();
    return success(res, categories, 'Self study paths fetched successfully');
  } catch (err) {
    console.error('Get Self Study Paths Error:', err);
    return error(res, 'Failed to fetch self study paths', 500);
  }
};

// @desc    Get subjects for a self study path
// @route   GET /api/self-study/:id/subjects
// @access  Public
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await SelfStudyModel.getSubjects(req.params.id);
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
    const topics = await SelfStudyModel.getTopics(req.params.id);
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
    const microTopics = await SelfStudyModel.getMicroTopics(req.params.id);
    return success(res, microTopics, 'Micro topics fetched successfully');
  } catch (err) {
    console.error('Get Micro Topics Error:', err);
    return error(res, 'Failed to fetch micro topics', 500);
  }
};

// @desc    Create a self study path
// @route   POST /api/self-study
// @access  Admin
exports.createCategory = async (req, res) => {
  try {
    const category = await SelfStudyModel.create(req.body);
    return success(res, category, 'Self study path created successfully', 201);
  } catch (err) {
    console.error('Create Self Study Path Error:', err);
    return error(res, 'Failed to create self study path', 500);
  }
};

// @desc    Update a self study path
// @route   PUT /api/self-study/:id
// @access  Admin
exports.updateCategory = async (req, res) => {
  try {
    const category = await SelfStudyModel.update(req.params.id, req.body);
    if (!category) {
      return error(res, 'Self study path not found or no changes provided', 404);
    }
    return success(res, category, 'Self study path updated successfully');
  } catch (err) {
    console.error('Update Self Study Path Error:', err);
    return error(res, 'Failed to update self study path', 500);
  }
};

// @desc    Delete a self study path
// @route   DELETE /api/self-study/:id
// @access  Admin
exports.deleteCategory = async (req, res) => {
  try {
    await SelfStudyModel.delete(req.params.id);
    return success(res, null, 'Self study path deleted successfully');
  } catch (err) {
    console.error('Delete Self Study Path Error:', err);
    return error(res, 'Failed to delete self study path (may be in use)', 500);
  }
};
