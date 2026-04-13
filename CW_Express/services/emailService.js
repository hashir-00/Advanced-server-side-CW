const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('../config/config');
const db = require('../config/dbConfig');
const logger = require('../utils/logger');

/**
 * Email service for sending verification emails
 */

// Create transporter
const transporter = nodemailer.createTransport(config.email);

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    logger.service.error('emailService.init', 'Email service configuration error', error);
  } else {
    logger.service.info('emailService.init', 'Email service is ready');
  }
});

/**
 * Generate a secure verification token
 * @returns {string} Secure random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create and store email verification token
 * @param {number} userId - User ID
 * @returns {Promise<string>} Verification token
 */
const createVerificationToken = async (userId) => {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + config.tokenExpiryHours);
  
  // Delete any existing tokens for this user
  logger.repo.info('emailService.createVerificationToken', 'Deleting existing tokens', userId);
  await db.query(
    'DELETE FROM email_verification_tokens WHERE user_id = ?',
    [userId]
  );
  
  // Insert new token
  logger.repo.info('emailService.createVerificationToken', 'Inserting new token', userId);
  await db.query(
    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  
  return token;
};

/**
 * Verify email verification token
 * @param {string} token - Verification token
 * @returns {Promise<number|null>} User ID if valid, null otherwise
 */
const verifyToken = async (token) => {
  logger.service.info('emailService.verifyToken', 'Verifying token');
  logger.repo.info('emailService.verifyToken', 'Querying token');
  const [tokens] = await db.query(
    `SELECT user_id, expires_at FROM email_verification_tokens 
     WHERE token = ? AND expires_at > NOW()`,
    [token]
  );
  
  if (tokens.length === 0) {
    return null;
  }
  
  return tokens[0].user_id;
};

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {string} firstName - User's first name
 */
const sendVerificationEmail = async (email, token, firstName) => {
  const verificationUrl = `http://localhost:${config.port}/api/auth/verify/${token}`;
  
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Verify Your Email - Alumni Influencer Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Alumni Influencer Platform!</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Thank you for registering with the Alumni Influencer Platform. Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4CAF50;">${verificationUrl}</p>
            <p><strong>This link will expire in ${config.tokenExpiryHours} hours.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Alumni Influencer Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    logger.service.info('emailService.sendVerificationEmail', 'Sending verification email to', email);
    await transporter.sendMail(mailOptions);
    logger.service.info('emailService.sendVerificationEmail', 'Verification email sent successfully', email);
  } catch (error) {
    logger.service.error('emailService.sendVerificationEmail', 'Error sending verification email', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send winner notification email
 * @param {string} email - Recipient email
 * @param {string} firstName - User's first name
 * @param {string} date - Winner date
 * @param {number} bidAmount - Winning bid amount
 */
const sendWinnerNotification = async (email, firstName, date, bidAmount) => {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: 'Congratulations! You are Alumni of the Day',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FFD700; color: #333; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .highlight { background-color: #FFD700; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Congratulations ${firstName}! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>We're excited to inform you that you have won the bid to be featured as <strong>Alumni of the Day</strong>!</p>
            <div class="highlight">
              <h2>Your Feature Date: ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
              <p>Winning Bid: $${bidAmount}</p>
            </div>
            <p>Your profile will be prominently featured on our platform, giving you maximum visibility to connect with fellow alumni and potential opportunities.</p>
            <p>Make sure your profile is up to date with your latest achievements and information!</p>
            <p>Thank you for being an active member of our alumni community.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Alumni Influencer Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    logger.service.info('emailService.sendWinnerNotification', 'Sending winner notification to', email);
    await transporter.sendMail(mailOptions);
    logger.service.info('emailService.sendWinnerNotification', 'Winner notification sent successfully', email);
  } catch (error) {
    logger.service.error('emailService.sendWinnerNotification', 'Error sending winner notification', error);
  }
};

module.exports = {
  generateToken,
  createVerificationToken,
  verifyToken,
  sendVerificationEmail,
  sendWinnerNotification
};
