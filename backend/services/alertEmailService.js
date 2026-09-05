const nodemailer = require('nodemailer');
const env = require('../config/env');
const db = require('../config/db');

class AlertEmailService {
  constructor() {
    // Map of threshold -> last sent timestamp (ms)
    this.lastThresholdAlertSent = new Map();
  }

  /**
   * Get Nodemailer transporter instance if SMTP credentials are set
   */
  getTransporter() {
    if (!env.EMAIL_USER || !env.EMAIL_PASS) {
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS
      }
    });
  }

  /**
   * Resolve recipient admin email from DB settings or env
   */
  async getRecipientEmail() {
    try {
      const res = await db.query("SELECT value FROM site_settings WHERE key = 'alert_email'");
      if (res.rows.length > 0 && res.rows[0].value) {
        return res.rows[0].value;
      }
    } catch (e) {
      // Fallback
    }
    return env.ADMIN_EMAIL || env.EMAIL_USER || 'admin@medhashree.com';
  }

  /**
   * Resolve threshold configuration from DB settings or env
   */
  async getThresholdConfig() {
    let threshold = env.ONLINE_USER_ALERT_THRESHOLD || 100;
    let enabled = env.ENABLE_ONLINE_ALERTS !== false;
    let cooldownMin = env.ALERT_COOLDOWN_MINUTES || 60;

    try {
      const dbThresh = await db.query("SELECT value FROM site_settings WHERE key = 'online_user_alert_threshold'");
      if (dbThresh.rows.length > 0 && dbThresh.rows[0].value) {
        threshold = parseInt(dbThresh.rows[0].value, 10);
      }

      const dbEnable = await db.query("SELECT value FROM site_settings WHERE key = 'enable_online_alerts'");
      if (dbEnable.rows.length > 0) {
        enabled = dbEnable.rows[0].value === 'true';
      }

      const dbCooldown = await db.query("SELECT value FROM site_settings WHERE key = 'alert_cooldown_minutes'");
      if (dbCooldown.rows.length > 0 && dbCooldown.rows[0].value) {
        cooldownMin = parseInt(dbCooldown.rows[0].value, 10);
      }
    } catch (e) {
      // Ignore DB read failure fallback to env
    }

    return { threshold, enabled, cooldownMin };
  }

  /**
   * Check online users count against thresholds and dispatch email if required
   * @param {number} currentOnlineCount
   */
  async checkOnlineUserThreshold(currentOnlineCount) {
    const config = await this.getThresholdConfig();

    if (!config.enabled) return;
    if (currentOnlineCount < config.threshold) return;

    // Standard thresholds: configured threshold (e.g. 100), 250, 500, 1000, 5000
    const thresholds = [config.threshold, 250, 500, 1000, 2500, 5000].filter(t => t >= config.threshold);

    // Find highest threshold achieved
    let triggeredThreshold = 0;
    for (const t of thresholds) {
      if (currentOnlineCount >= t) {
        triggeredThreshold = t;
      }
    }

    if (triggeredThreshold === 0) return;

    const now = Date.now();
    const lastSent = this.lastThresholdAlertSent.get(triggeredThreshold) || 0;
    const cooldownMs = config.cooldownMin * 60 * 1000;

    // Enforce cooldown
    if (now - lastSent < cooldownMs) {
      return;
    }

    // Mark as sent before sending to prevent duplicate triggers
    this.lastThresholdAlertSent.set(triggeredThreshold, now);

    const recipient = await this.getRecipientEmail();
    await this.sendHighTrafficAlert(recipient, currentOnlineCount, triggeredThreshold);
  }

  /**
   * Send High Traffic Alert Email
   */
  async sendHighTrafficAlert(toEmail, count, threshold) {
    const transporter = this.getTransporter();
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1e293b;">
          <h1 style="color: #6366f1; margin: 0; font-size: 28px;">🚀 Traffic Milestone Alert</h1>
          <p style="color: #94a3b8; margin-top: 5px; font-size: 14px;">Medhashree Activity Monitor</p>
        </div>
        
        <div style="padding: 25px 0; text-align: center;">
          <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #9333ea); border-radius: 16px; padding: 20px 40px; margin-bottom: 20px;">
            <span style="font-size: 48px; font-weight: 800; color: #ffffff; display: block;">${count}</span>
            <span style="font-size: 14px; text-transform: uppercase; tracking-wider: 2px; color: #e0e7ff;">People Online Right Now!</span>
          </div>
          
          <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6;">
            Great news! Your website has crossed the milestone threshold of <strong>${threshold}+ active users</strong> online simultaneously.
          </p>
        </div>
        
        <div style="background: #1e293b; border-radius: 8px; padding: 15px; margin-bottom: 20px; font-size: 13px; color: #94a3b8;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Triggered Threshold:</span> <strong style="color: #f1f5f9;">${threshold} users</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>Current Real-time Count:</span> <strong style="color: #10b981;">${count} users</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Timestamp:</span> <strong style="color: #f1f5f9;">${nowStr}</strong>
          </div>
        </div>
        
        <div style="text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; padding-top: 15px;">
          This is an automated notification from your Medhashree Admin Alert System.
        </div>
      </div>
    `;

    console.log(`[ALERT EMAIL] 🚨 High Traffic Milestone: ${count} users online! (Threshold: ${threshold})`);

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Medhashree Alert" <${env.EMAIL_USER}>`,
          to: toEmail,
          subject: `🔥 ALERT: ${count} People Online Right Now on Medhashree!`,
          html: htmlContent
        });
        console.log(`[ALERT EMAIL] Email delivered successfully to ${toEmail}`);
        return true;
      } catch (err) {
        console.error('[ALERT EMAIL Error] Failed to send email via SMTP:', err.message);
        return false;
      }
    } else {
      console.log(`[ALERT EMAIL Simulation] SMTP credentials not set. Simulated email to ${toEmail}`);
      return false;
    }
  }

  /**
   * Send Security Alert Email
   */
  async sendSecurityAlert(toEmail, subject, details) {
    const transporter = this.getTransporter();
    if (!transporter) return false;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #18181b; color: #f4f4f5; border-radius: 12px; padding: 25px;">
        <h2 style="color: #ef4444; border-bottom: 1px solid #27272a; padding-bottom: 10px;">⚠️ Security Alert</h2>
        <p style="font-size: 15px;">A security event requires your attention:</p>
        <div style="background: #27272a; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 13px; color: #fca5a5;">
          <pre style="margin:0; white-space: pre-wrap;">${JSON.stringify(details, null, 2)}</pre>
        </div>
        <p style="font-size: 12px; color: #71717a; margin-top: 20px;">Medhashree Security Service</p>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"Medhashree Security" <${env.EMAIL_USER}>`,
        to: toEmail,
        subject: `⚠️ SECURITY ALERT: ${subject}`,
        html: htmlContent
      });
      return true;
    } catch (err) {
      console.error('[Security Alert Email Error]', err.message);
      return false;
    }
  }

  /**
   * Send Test Email from Admin Panel
   */
  async sendTestEmail(targetEmail) {
    const transporter = this.getTransporter();
    if (!transporter) {
      throw new Error('SMTP credentials (EMAIL_USER & EMAIL_PASS) are missing in environment configuration');
    }

    const testSubject = 'Medhashree Email Alerts Test';
    const testHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #fff; border-radius: 8px;">
        <h2 style="color: #6366f1;">Test Email Notification</h2>
        <p>Your Medhashree email alert system is working perfectly!</p>
        <p style="color: #94a3b8; font-size: 13px;">Tested at: ${new Date().toISOString()}</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Medhashree System" <${env.EMAIL_USER}>`,
      to: targetEmail,
      subject: testSubject,
      html: testHtml
    });

    return true;
  }
}

module.exports = new AlertEmailService();
