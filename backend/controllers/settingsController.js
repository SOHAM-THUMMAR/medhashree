const db = require('../config/db');
const { success, error } = require('../utils/apiResponse');

/**
 * @desc    Get all site settings
 * @route   GET /api/site-settings
 * @access  Public
 */
exports.getSettings = async (req, res) => {
  try {
    const result = await db.query('SELECT key, value FROM site_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    return success(res, settings, 'Site settings fetched successfully');
  } catch (err) {
    console.error('Get Settings Error:', err);
    return error(res, 'Failed to fetch site settings', 500);
  }
};

/**
 * @desc    Update site settings
 * @route   PUT /api/site-settings
 * @access  Admin
 */
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    if (!settings || typeof settings !== 'object') {
      return error(res, 'Invalid request body. Expected an object of key-value pairs.', 400);
    }

    // Upsert each key-value pair
    for (const [key, value] of Object.entries(settings)) {
      if (typeof key !== 'string' || value === undefined || value === null) continue;
      await db.query(`
        INSERT INTO site_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = $2
      `, [key, String(value)]);
    }

    // Fetch and return the updated settings
    const result = await db.query('SELECT key, value FROM site_settings');
    const updatedSettings = {};
    result.rows.forEach(row => {
      updatedSettings[row.key] = row.value;
    });

    return success(res, updatedSettings, 'Site settings updated successfully');
  } catch (err) {
    console.error('Update Settings Error:', err);
    return error(res, 'Failed to update site settings', 500);
  }
};
