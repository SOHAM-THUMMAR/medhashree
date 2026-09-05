const alertEmailService = require('../../services/alertEmailService');
const db = require('../../config/db');
const { success, error } = require('../../utils/apiResponse');

// @desc    Send test alert email to specified or all admin emails
// @route   POST /api/admin/alerts/test
// @access  Admin
exports.sendTestAlertEmail = async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const recipient = targetEmail || await alertEmailService.getRecipientEmails();

    await alertEmailService.sendTestEmail(recipient);
    return success(res, { recipient }, `Test alert email sent to ${recipient}`);
  } catch (err) {
    console.error('Test Alert Email Error:', err);
    return error(res, `Failed to send test email: ${err.message}`, 400);
  }
};

// @desc    Get threshold email alert configuration
// @route   GET /api/admin/alerts/config
// @access  Admin
exports.getAlertConfig = async (req, res) => {
  try {
    const config = await alertEmailService.getThresholdConfig();
    const recipientEmail = await alertEmailService.getRecipientEmails();
    return success(res, { ...config, recipientEmail }, 'Alert configuration fetched');
  } catch (err) {
    console.error('Get Alert Config Error:', err);
    return error(res, 'Failed to fetch alert config', 500);
  }
};

// @desc    Update threshold email alert configuration
// @route   PUT /api/admin/alerts/config
// @access  Admin
exports.updateAlertConfig = async (req, res) => {
  try {
    const { threshold, enabled, cooldownMinutes, recipientEmail } = req.body;

    if (threshold !== undefined) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('online_user_alert_threshold', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [String(threshold)]
      );
    }

    if (enabled !== undefined) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('enable_online_alerts', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [String(enabled)]
      );
    }

    if (cooldownMinutes !== undefined) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('alert_cooldown_minutes', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [String(cooldownMinutes)]
      );
    }

    if (recipientEmail) {
      await db.query(
        "INSERT INTO site_settings (key, value) VALUES ('alert_email', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [recipientEmail]
      );
    }

    const updatedConfig = await alertEmailService.getThresholdConfig();
    const updatedRecipient = await alertEmailService.getRecipientEmail();

    return success(res, { ...updatedConfig, recipientEmail: updatedRecipient }, 'Alert configuration updated');
  } catch (err) {
    console.error('Update Alert Config Error:', err);
    return error(res, 'Failed to update alert config', 500);
  }
};
