const FixedQuizModel = require('../models/fixedQuizModel');
const QuestionModel = require('../models/questionModel');
const SessionModel = require('../models/sessionModel');
const { success, error } = require('../utils/apiResponse');

// @desc    Get all fixed quizzes
// @route   GET /api/fixed-quizzes
// @access  Public
exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await FixedQuizModel.getAll();
    return success(res, quizzes, 'Fixed quizzes fetched successfully');
  } catch (err) {
    console.error('Get Fixed Quizzes Error:', err);
    return error(res, 'Failed to fetch fixed quizzes', 500);
  }
};

// @desc    Get a single fixed quiz configuration
// @route   GET /api/fixed-quizzes/:id
// @access  Admin
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await FixedQuizModel.getById(req.params.id);
    if (!quiz) {
      return error(res, 'Fixed quiz card not found', 404);
    }
    return success(res, quiz, 'Fixed quiz card details fetched successfully');
  } catch (err) {
    console.error('Get Fixed Quiz Card Error:', err);
    return error(res, 'Failed to fetch fixed quiz details', 500);
  }
};

// @desc    Create a new fixed quiz card
// @route   POST /api/fixed-quizzes
// @access  Admin
exports.createQuiz = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return error(res, 'Quiz card title is required', 400);
    }

    const quiz = await FixedQuizModel.create(req.body);
    return success(res, quiz, 'Fixed quiz card created successfully', 201);
  } catch (err) {
    console.error('Create Fixed Quiz Error:', err);
    return error(res, 'Failed to create fixed quiz card', 500);
  }
};

// @desc    Update a fixed quiz card
// @route   PUT /api/fixed-quizzes/:id
// @access  Admin
exports.updateQuiz = async (req, res) => {
  try {
    const { title } = req.body;
    if (title !== undefined && (!title || !title.trim())) {
      return error(res, 'Quiz card title cannot be empty', 400);
    }

    const quiz = await FixedQuizModel.update(req.params.id, req.body);
    if (!quiz) {
      return error(res, 'Fixed quiz card not found or no changes made', 404);
    }
    return success(res, quiz, 'Fixed quiz card updated successfully');
  } catch (err) {
    console.error('Update Fixed Quiz Error:', err);
    return error(res, 'Failed to update fixed quiz card', 500);
  }
};

// @desc    Delete a fixed quiz card
// @route   DELETE /api/fixed-quizzes/:id
// @access  Admin
exports.deleteQuiz = async (req, res) => {
  try {
    const deleted = await FixedQuizModel.delete(req.params.id);
    return success(res, null, 'Fixed quiz card deleted successfully');
  } catch (err) {
    console.error('Delete Fixed Quiz Error:', err);
    return error(res, 'Failed to delete fixed quiz card', 500);
  }
};

// @desc    Play a fixed quiz (generates solo session matching filters)
// @route   POST /api/fixed-quizzes/:id/play
// @access  Protected
exports.playQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await FixedQuizModel.getById(quizId);

    if (!quiz) {
      return error(res, 'Fixed quiz card not found', 404);
    }

    // 1. Fetch random questions matching filters
    const questions = await QuestionModel.getRandomByFilters({
      category_id: quiz.category_id,
      subject_id: quiz.subject_id,
      topic_id: quiz.topic_id,
      micro_topic_id: quiz.micro_topic_id,
      limit: parseInt(quiz.question_count) || 10
    });

    if (questions.length === 0) {
      return error(res, 'No active database questions found matching this quiz\'s category/subject/topic filters.', 404);
    }

    // 2. Create the solo quiz session
    const session = await SessionModel.create({
      quiz_type: 'solo',
      category_id: quiz.category_id || questions[0]?.category_id || null,
      subject_id: quiz.subject_id || questions[0]?.subject_id || null,
      topic_id: quiz.topic_id || questions[0]?.topic_id || null,
      micro_topic_id: quiz.micro_topic_id || questions[0]?.micro_topic_id || null,
      difficulty: questions[0]?.difficulty_label || 'Medium',
      question_count: questions.length,
      time_per_question: 60, // 60 seconds per question is standard
      user1_id: req.user.userId,
      user2_id: null,
      status: 'in_progress'
    });

    // 3. Link retrieved questions to session
    for (let i = 0; i < questions.length; i++) {
      await SessionModel.addQuestion(session.session_id, questions[i].question_id, i + 1);
    }

    return success(res, {
      session,
      questionCount: questions.length
    }, 'Fixed quiz session started successfully', 201);
  } catch (err) {
    console.error('Play Fixed Quiz Error:', err);
    return error(res, 'Failed to start quiz session', 500);
  }
};
