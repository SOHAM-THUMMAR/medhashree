const NewsModel = require('../models/newsModel');
const { success, error } = require('../utils/apiResponse');

// @desc    Create news
// @route   POST /api/news
// @access  Admin
exports.createNews = async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    if (!title || !description) {
      return error(res, 'Title and description are required', 400);
    }

    const news = await NewsModel.create({
      title,
      description,
      tag,
      published_by: req.user.userId
    });

    return success(res, news, 'News published successfully', 201);
  } catch (err) {
    console.error('Create News Error:', err);
    return error(res, 'Failed to publish news', 500);
  }
};

// @desc    Get all news
// @route   GET /api/news
// @access  Public
exports.getAllNews = async (req, res) => {
  try {
    const { tag } = req.query;
    const news = await NewsModel.getAll(tag);
    return success(res, news, 'News fetched successfully');
  } catch (err) {
    console.error('Get News Error:', err);
    return error(res, 'Failed to fetch news', 500);
  }
};

// @desc    Get latest news
// @route   GET /api/news/latest
// @access  Public
exports.getLatestNews = async (req, res) => {
  try {
    const news = await NewsModel.getLatest();
    return success(res, news, 'Latest news fetched successfully');
  } catch (err) {
    console.error('Get Latest News Error:', err);
    return error(res, 'Failed to fetch latest news', 500);
  }
};

// @desc    Delete news
// @route   DELETE /api/news/:id
// @access  Admin
exports.deleteNews = async (req, res) => {
  try {
    const existing = await NewsModel.getById(req.params.id);
    if (!existing) return error(res, 'News not found', 404);

    await NewsModel.delete(req.params.id);
    return success(res, null, 'News deleted successfully');
  } catch (err) {
    console.error('Delete News Error:', err);
    return error(res, 'Failed to delete news', 500);
  }
};