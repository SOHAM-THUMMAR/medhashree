const { parseCSV } = require('../services/csvParserService');
const { handleCSVUpload } = require('../handlers/csvHandler');
const QuizModel = require('../models/quizModel');
const QuestionModel = require('../models/questionModel');
const { success, error } = require('../utils/apiResponse');
const fs = require('fs');

// @desc    Get latest quizzes
// @route   GET /api/quizzes/latest
// @access  Public
exports.getLatestQuizzes = async (req, res) => {
  try {
    const db = require('../config/db');
    const result = await db.query(`
      SELECT qf.file_id, qf.file_name, qf.subject, qf.question_count, c.name as category_name
      FROM question_files qf
      LEFT JOIN categories c ON qf.subject = c.name
      WHERE qf.status = 'Published' OR qf.status = 'Draft'
      ORDER BY qf.uploaded_at DESC
      LIMIT 4
    `);
    
    // Map to frontend expected format
    const quizzes = result.rows.map(q => ({
      id: q.file_id,
      title: q.file_name,
      category: q.category_name || q.subject || 'General',
      questionsCount: q.question_count
    }));
    
    return success(res, quizzes, 'Latest quizzes fetched successfully');
  } catch (err) {
    console.error('Get Latest Quizzes Error:', err);
    return error(res, 'Failed to fetch latest quizzes', 500);
  }
};

// @desc    Get explore quizzes (all published/draft)
// @route   GET /api/quizzes/explore
// @access  Public
exports.getExploreQuizzes = async (req, res) => {
  try {
    const db = require('../config/db');
    const { category } = req.query;
    
    let query = `
      SELECT qf.file_id, qf.file_name, qf.subject, qf.question_count, c.name as category_name, c.category_id
      FROM question_files qf
      LEFT JOIN categories c ON qf.subject = c.name
      WHERE qf.status = 'Published' OR qf.status = 'Draft'
    `;
    const queryParams = [];
    
    if (category) {
      if (!isNaN(parseInt(category))) {
        query += ` AND c.category_id = $1`;
        queryParams.push(category);
      } else {
        query += ` AND (c.name ILIKE $1 OR qf.subject ILIKE $1)`;
        queryParams.push(`%${category}%`);
      }
    }
    
    query += ` ORDER BY qf.uploaded_at DESC`;

    const result = await db.query(query, queryParams);
    
    const quizzes = result.rows.map(q => ({
      id: q.file_id,
      title: q.file_name,
      category: q.category_name || q.subject || 'General',
      categoryId: q.category_id,
      questionsCount: q.question_count
    }));
    
    return success(res, quizzes, 'Explore quizzes fetched successfully');
  } catch (err) {
    console.error('Get Explore Quizzes Error:', err);
    return error(res, 'Failed to fetch explore quizzes', 500);
  }
};

// @desc    Upload quiz via CSV
// @route   POST /api/quizzes/upload
// @access  Instructor/Admin
exports.uploadQuiz = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'Please upload a CSV file', 400);
    }

    const { subject, topic, micro_topic, categoryId, isTournament, isSolvedPaper } = req.body;

    // 1. Parse CSV
    const { questions, errors: parseErrors } = await parseCSV(req.file.path);

    if (questions.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return error(res, 'No valid questions found in CSV. ' + (parseErrors.length > 0 ? `Errors: ${JSON.stringify(parseErrors)}` : ''), 400);
    }

    // 2. Handle bulk insert
    const result = await handleCSVUpload({
      questions,
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      categoryId,
      subject,
      topic,
      microTopic: micro_topic,
      userId: req.user.userId,
      isTournament: isTournament === 'true' || isTournament === true || String(isTournament).toLowerCase() === 'true',
      isSolvedPaper: isSolvedPaper === 'true' || isSolvedPaper === true || String(isSolvedPaper).toLowerCase() === 'true'
    });

    return success(res, {
      ...result,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined
    }, 'Quiz uploaded successfully', 201);
  } catch (err) {
    console.error('Upload Quiz Error:', err);
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return error(res, 'Failed to upload quiz', 500);
  }
};

// @desc    Get user's quizzes
// @route   GET /api/quizzes/my
// @access  Protected
exports.getMyQuizzes = async (req, res) => {
  try {
    const files = await QuizModel.getFilesByUser(req.user.userId);
    return success(res, files, 'User quizzes fetched successfully');
  } catch (err) {
    console.error('Get My Quizzes Error:', err);
    return error(res, 'Failed to fetch quizzes', 500);
  }
};

// @desc    Get questions for a quiz file
// @route   GET /api/quizzes/:fileId/questions
// @access  Public
exports.getQuizQuestions = async (req, res) => {
  try {
    const questions = await QuestionModel.getByFileId(req.params.fileId);
    return success(res, questions, 'Quiz questions fetched successfully');
  } catch (err) {
    console.error('Get Quiz Questions Error:', err);
    return error(res, 'Failed to fetch questions', 500);
  }
};

// @desc    Delete a quiz file
// @route   DELETE /api/quizzes/:fileId
// @access  Protected
exports.deleteQuiz = async (req, res) => {
  try {
    const file = await QuizModel.getFileById(req.params.fileId);
    if (!file) {
      return error(res, 'Quiz file not found', 404);
    }

    // Only allow deletion by owner or admin
    if (file.uploaded_by !== req.user.userId && req.user.role !== 'admin') {
      return error(res, 'Not authorized to delete this quiz', 403);
    }

    await QuizModel.deleteFile(req.params.fileId);
    return success(res, null, 'Quiz deleted successfully');
  } catch (err) {
    console.error('Delete Quiz Error:', err);
    return error(res, 'Failed to delete quiz', 500);
  }
};

// @desc    Get solved papers (files where is_solved_paper = true and status = 'Published')
// @route   GET /api/quizzes/solved-papers
// @access  Public
exports.getSolvedPapers = async (req, res) => {
  try {
    const db = require('../config/db');
    const result = await db.query(`
      SELECT qf.file_id, qf.file_name, qf.subject, qf.topic, qf.micro_topic, qf.question_count, qf.uploaded_at, qf.year, qf.month
      FROM question_files qf
      WHERE qf.is_solved_paper = true AND qf.status = 'Published'
      ORDER BY qf.uploaded_at DESC
    `);
    
    const papers = result.rows.map(q => {
      // Dynamic extraction of year (4-digit number) from title, topic, or fallback to upload year
      let year = q.year;
      if (!year) {
        const yearMatch = q.file_name.match(/\b(19|20)\d{2}\b/) || (q.topic && q.topic.match(/\b(19|20)\d{2}\b/));
        year = yearMatch ? parseInt(yearMatch[0]) : new Date(q.uploaded_at).getFullYear();
      }
      
      return {
        id: q.file_id,
        title: q.file_name,
        category: q.subject || 'General',
        topic: q.topic || '',
        microTopic: q.micro_topic || '',
        questionsCount: q.question_count,
        year: year,
        month: q.month || '',
        uploadedAt: q.uploaded_at
      };
    });
    
    return success(res, papers, 'Solved papers fetched successfully');
  } catch (err) {
    console.error('Get Solved Papers Error:', err);
    return error(res, 'Failed to fetch solved papers', 500);
  }
};

// @desc    Get solved paper questions
// @route   GET /api/quizzes/solved-papers/:fileId/questions
// @access  Public
exports.getSolvedPaperQuestions = async (req, res) => {
  try {
    const questions = await QuestionModel.getByFileId(req.params.fileId);
    return success(res, questions, 'Solved paper questions fetched successfully');
  } catch (err) {
    console.error('Get Solved Paper Questions Error:', err);
    return error(res, 'Failed to fetch questions', 500);
  }
};

// @desc    Upload quiz via JSON (fully parsed with optional base64 images)
// @route   POST /api/quizzes/upload-json
// @access  Instructor/Admin
exports.uploadQuizJSON = async (req, res) => {
  try {
    const { subject, topic, micro_topic, categoryId, isTournament, isSolvedPaper, year, month, questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return error(res, 'No questions provided', 400);
    }

    // Generate descriptive filename for the paper
    const displayMonth = month ? month.trim() : '';
    const displayYear = year ? String(year).trim() : '';
    const fileName = `${subject} ${displayYear} ${displayMonth} Solved PYQ Paper`.replace(/\s+/g, ' ').trim();

    // Bulk insert questions
    const result = await handleCSVUpload({
      questions,
      fileName: fileName,
      fileUrl: 'json-upload',
      categoryId,
      subject,
      topic,
      microTopic: micro_topic,
      userId: req.user.userId,
      isTournament: isTournament === 'true' || isTournament === true,
      isSolvedPaper: isSolvedPaper === 'true' || isSolvedPaper === true,
      year: year ? parseInt(year) : null,
      month: month || null
    });

    return success(res, result, 'Quiz uploaded successfully', 201);
  } catch (err) {
    console.error('Upload Quiz JSON Error:', err);
    return error(res, 'Failed to upload quiz', 500);
  }
};

// @desc    Get explore questions directly from db
// @route   GET /api/quizzes/explore-questions
// @access  Public
exports.getExploreQuestions = async (req, res) => {
  try {
    const db = require('../config/db');
    const { category } = req.query;
    
    let query = `
      SELECT q.*, c.name as category_name, s.name as subject_name, t.name as topic_name
      FROM questions q
      LEFT JOIN categories c ON q.category_id = c.category_id
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      LEFT JOIN topics t ON q.topic_id = t.topic_id
      LEFT JOIN question_files qf ON q.file_id = qf.file_id
      WHERE q.is_active = true
        AND (q.file_id IS NULL OR qf.is_solved_paper = false)
    `;
    const queryParams = [];
    
    if (category) {
      if (!isNaN(parseInt(category))) {
        query += ` AND q.category_id = $1`;
        queryParams.push(category);
      } else {
        query += ` AND c.name ILIKE $1`;
        queryParams.push(`%${category}%`);
      }
    }
    
    query += ` ORDER BY q.question_id DESC LIMIT 200`;

    const result = await db.query(query, queryParams);
    return success(res, result.rows, 'Explore questions fetched successfully');
  } catch (err) {
    console.error('Get Explore Questions Error:', err);
    return error(res, 'Failed to fetch explore questions', 500);
  }
};

