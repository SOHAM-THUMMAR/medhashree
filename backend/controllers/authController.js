const UserModel = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/hashPassword');
const { generateToken } = require('../utils/generateToken');
const nodemailer = require('nodemailer');
const db = require('../config/db');
const env = require('../config/env');
const loggerService = require('../services/loggerService');

exports.register = async (req, res) => {
  try {
    const { full_name, email, username, password, role } = req.body;

    // 1. Validate input
    if (!full_name || !email || !username || !password) {
      return res.status(400).json({ success: false, error: 'Please provide full_name, email, username, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    // 2. Check existing user
    const emailExists = await UserModel.findByEmail(email);
    if (emailExists) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const usernameExists = await UserModel.findByUsername(username);
    if (usernameExists) {
      return res.status(400).json({ success: false, error: 'Username is already taken' });
    }

    // 3. Hash password
    const password_hash = await hashPassword(password);

    // 4. Create user
    const newUser = await UserModel.create({
      full_name,
      email,
      username,
      password_hash,
      role: 'student' // Force all self-registrations to be students
    });

    // 5. Generate token
    const token = generateToken({ userId: newUser.user_id, role: newUser.role });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        token
      }
    });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required' });
    }

    // 1. Find user by email
    const user = await UserModel.findByEmail(email.trim());
    if (!user) {
      return res.status(404).json({ success: false, error: 'User with this email does not exist' });
    }

    // 2. Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Please contact support.' });
    }

    // 3. Handle Admin Role -> Generate and send OTP automatically
    if (user.role === 'admin') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins ISO format

      await db.query(
        'INSERT INTO password_resets (user_id, otp, expires_at) VALUES ($1, $2, $3)',
        [user.user_id, otp, expiresAt]
      );

      let emailSent = false;
      if (env.EMAIL_USER && env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS }
          });

          await transporter.sendMail({
            from: `"Medhashree Admin Control" <${env.EMAIL_USER}>`,
            to: user.email,
            subject: '👑 Your Medhashree Admin Login OTP',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 25px; background: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #6366f1; margin-bottom: 5px;">Admin Login Verification</h2>
                <p style="color: #94a3b8; font-size: 14px;">An admin login attempt was initiated for account: <strong>${user.email}</strong></p>
                <div style="background: #1e293b; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #38bdf8;">${otp}</span>
                </div>
                <p style="font-size: 12px; color: #64748b;">This OTP code expires in 10 minutes. If you did not attempt this login, contact system support immediately.</p>
              </div>
            `
          });
          emailSent = true;
        } catch (mailErr) {
          console.error('[Admin Login OTP Email Error]', mailErr.message);
        }
      }

      console.log(`\n=================================\n👑 ADMIN LOGIN OTP DISPATCHED\nEmail: ${user.email}\nOTP Code: ${otp}\n=================================\n`);

      loggerService.logSecurity('ADMIN_LOGIN_OTP_DISPATCHED', req, { email: user.email }, 200);

      return res.status(200).json({
        success: true,
        isAdmin: true,
        email: user.email,
        message: emailSent
          ? 'Admin OTP sent to your registered email.'
          : 'Admin OTP generated (Check server terminal console if SMTP is unconfigured).'
      });
    }

    // 4. Non-admin user -> Require password next
    return res.status(200).json({
      success: true,
      isAdmin: false,
      email: user.email
    });

  } catch (err) {
    console.error('Check Email Error:', err);
    res.status(500).json({ success: false, error: 'Server error checking email' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password' });
    }

    // 1. Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // 2. Verify password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // 3. Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Please contact support.' });
    }

    // 4. Handle Admin 2FA OTP Login
    if (user.role === 'admin') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await db.query(
        'INSERT INTO password_resets (user_id, otp, expires_at) VALUES ($1, $2, $3)',
        [user.user_id, otp, expiresAt]
      );

      let emailSent = false;
      if (env.EMAIL_USER && env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS }
          });

          await transporter.sendMail({
            from: `"Medhashree Admin Control" <${env.EMAIL_USER}>`,
            to: user.email,
            subject: '👑 Your Medhashree Admin Login OTP',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 25px; background: #0f172a; color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #6366f1; margin-bottom: 5px;">Admin Login Verification</h2>
                <p style="color: #94a3b8; font-size: 14px;">An admin login attempt was initiated for account: <strong>${user.email}</strong></p>
                <div style="background: #1e293b; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #38bdf8;">${otp}</span>
                </div>
                <p style="font-size: 12px; color: #64748b;">This OTP code expires in 10 minutes. If you did not attempt this login, contact system support immediately.</p>
              </div>
            `
          });
          emailSent = true;
        } catch (mailErr) {
          console.error('[Admin Login OTP Email Error]', mailErr.message);
        }
      }

      console.log(`\n=================================\n👑 ADMIN LOGIN OTP DISPATCHED\nEmail: ${user.email}\nOTP Code: ${otp}\n=================================\n`);

      loggerService.logSecurity('ADMIN_LOGIN_OTP_DISPATCHED', req, { email: user.email }, 200);

      return res.status(200).json({
        success: true,
        requiresOtp: true,
        email: user.email,
        message: emailSent
          ? 'Admin OTP sent to your registered email.'
          : 'Admin OTP generated (Check server terminal console if SMTP is unconfigured).'
      });
    }

    // 5. Regular User Token Generation
    const token = generateToken({ userId: user.user_id, role: user.role });
    delete user.password_hash;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user,
        token
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

/**
 * Verify Admin Login 6-Digit OTP
 */
exports.verifyAdminOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const user = await UserModel.findByEmail(email.trim());
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Unauthorized admin access attempt' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is deactivated' });
    }

    const otpResult = await db.query(
      `SELECT * FROM password_resets 
       WHERE user_id = $1 AND otp = $2 AND (is_used = FALSE OR is_used = 0) 
       ORDER BY id DESC LIMIT 1`,
      [user.user_id, otp.trim()]
    );

    if (otpResult.rows.length === 0) {
      loggerService.logSecurity('ADMIN_OTP_FAILED', req, { email, otpAttempt: otp }, 401);
      return res.status(401).json({ success: false, error: 'Invalid verification code' });
    }

    const record = otpResult.rows[0];

    // Expiration check (cross-engine compatible PostgreSQL & SQLite)
    const expiresAtMs = typeof record.expires_at === 'number'
      ? record.expires_at
      : new Date(record.expires_at).getTime();

    if (isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
      loggerService.logSecurity('ADMIN_OTP_EXPIRED', req, { email, otpAttempt: otp }, 401);
      return res.status(401).json({ success: false, error: 'Expired verification code. Please request a new OTP.' });
    }

    // Mark OTP as used
    await db.query('UPDATE password_resets SET is_used = TRUE WHERE id = $1', [record.id]);

    const token = generateToken({ userId: user.user_id, role: user.role });
    delete user.password_hash;

    loggerService.logInfo('ADMIN_LOGIN_SUCCESS', req, { userId: user.user_id, email: user.email });

    return res.status(200).json({
      success: true,
      message: 'Admin OTP verified successfully. Welcome back!',
      data: {
        user,
        token
      }
    });
  } catch (err) {
    console.error('Verify Admin OTP Error:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify admin OTP' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    
    const user = await UserModel.findByEmail(email.trim());
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins ISO format
    
    await db.query(
      'INSERT INTO password_resets (user_id, otp, expires_at) VALUES ($1, $2, $3)',
      [user.user_id, otp, expiresAt]
    );
    
    let emailSent = false;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Your QuizHub Password Reset OTP',
          html: `<div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                 <h2>QuizHub Password Reset</h2>
                 <p>You requested a password reset. Here is your One-Time Password (OTP):</p>
                 <h1 style="color: #5b5bff; letter-spacing: 2px;">${otp}</h1>
                 <p>This OTP will expire in 10 minutes.</p>
                 <p>If you did not request this, please ignore this email.</p>
                 </div>`
        };

        await transporter.sendMail(mailOptions);
        emailSent = true;
      } catch (mailErr) {
        console.error('Failed to send real email:', mailErr);
      }
    }

    console.log(`\n\n=== PASSWORD RESET SIMULATION ===\nEmail to: ${email}\nYour OTP is: ${otp}\n=================================\n\n`);
    
    res.status(200).json({ 
      success: true, 
      message: emailSent ? 'OTP sent to your email successfully.' : 'OTP sent (Check server console if missing SMTP credentials)' 
    });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ success: false, error: 'Server error during forgot password' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await UserModel.findByEmail(email ? email.trim() : '');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    const result = await db.query(
      `SELECT * FROM password_resets 
       WHERE user_id = $1 AND otp = $2 AND (is_used = FALSE OR is_used = 0)
       ORDER BY id DESC LIMIT 1`,
      [user.user_id, otp ? otp.trim() : '']
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    const record = result.rows[0];
    const expiresAtMs = typeof record.expires_at === 'number'
      ? record.expires_at
      : new Date(record.expires_at).getTime();

    if (isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
      return res.status(400).json({ success: false, error: 'Expired verification code' });
    }
    
    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ success: false, error: 'Server error during OTP verification' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }
    
    const user = await UserModel.findByEmail(email ? email.trim() : '');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    const tokenResult = await db.query(
      `SELECT * FROM password_resets 
       WHERE user_id = $1 AND otp = $2 AND (is_used = FALSE OR is_used = 0)
       ORDER BY id DESC LIMIT 1`,
      [user.user_id, otp ? otp.trim() : '']
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    const record = tokenResult.rows[0];
    const expiresAtMs = typeof record.expires_at === 'number'
      ? record.expires_at
      : new Date(record.expires_at).getTime();

    if (isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
      return res.status(400).json({ success: false, error: 'Expired verification code' });
    }
    
    const password_hash = await hashPassword(newPassword);
    
    await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [password_hash, user.user_id]);
    await db.query('UPDATE password_resets SET is_used = TRUE WHERE id = $1', [record.id]);
    
    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ success: false, error: 'Server error during password reset' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, error: 'Google token is required' });

    // Validate token with Google
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const payload = await googleRes.json();

    if (payload.error) {
      return res.status(401).json({ success: false, error: 'Invalid Google token' });
    }

    const { email, name, sub } = payload;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Could not fetch email from Google' });
    }

    // Check if user exists
    let user = await UserModel.findByEmail(email);
    
    if (!user) {
      // Create user
      const baseUsername = email.split('@')[0];
      
      user = await UserModel.create({
        full_name: name || 'Google User',
        email,
        username: baseUsername,
        password_hash: 'google_auth_controlled', // Placeholder
        role: 'student'
      });
    } else if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is deactivated. Please contact support.' });
    }

    // Generate token
    const token = generateToken({ userId: user.user_id, role: user.role });
    delete user.password_hash;

    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user,
        token
      }
    });

  } catch (err) {
    console.error('Google Login Error:', err);
    res.status(500).json({ success: false, error: 'Server error during Google login' });
  }
};
