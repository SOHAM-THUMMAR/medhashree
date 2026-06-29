const BugReportModel = require('../models/bugReportModel');
const { success, error } = require('../utils/apiResponse');

// @desc    Create bug report
// @route   POST /api/bug-reports
// @access  Protected
exports.createReport = async (req, res) => {
  try {
    const { title, description, specific_issue, type, priority } = req.body;

    if (!title) {
      return error(res, 'Title is required', 400);
    }

    const report = await BugReportModel.create({
      reported_by: req.user.userId,
      title,
      description,
      specific_issue,
      type,
      priority
    });

    return success(res, report, 'Bug report submitted successfully', 201);
  } catch (err) {
    console.error('Create Report Error:', err);
    return error(res, 'Failed to submit bug report', 500);
  }
};

// @desc    Get all bug reports
// @route   GET /api/bug-reports
// @access  Admin
exports.getAllReports = async (req, res) => {
  try {
    const reports = await BugReportModel.getAll();
    return success(res, reports, 'Bug reports fetched successfully');
  } catch (err) {
    console.error('Get Reports Error:', err);
    return error(res, 'Failed to fetch reports', 500);
  }
};

// @desc    Update report status
// @route   PUT /api/bug-reports/:id/status
// @access  Admin
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['unresolved', 'resolved', 'closed'].includes(status)) {
      return error(res, 'Invalid status. Must be unresolved, resolved, or closed', 400);
    }

    const updated = await BugReportModel.updateStatus(req.params.id, status);
    if (!updated) return error(res, 'Report not found', 404);

    return success(res, updated, `Report marked as ${status}`);
  } catch (err) {
    console.error('Update Report Status Error:', err);
    return error(res, 'Failed to update status', 500);
  }
};