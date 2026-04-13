const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');
const config = require('../config/config');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const register = async (req, res) => {
  logger.controller.info('authController.register', 'Registration attempt', req.body.email);
  try {
    const { email, password, firstName, lastName } = req.body;
    const [existingUsers] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      logger.controller.info('authController.register', 'Registration failed - email already exists', email);
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    logger.repo.info('authController.register', 'Inserting new user into database');
    const [result] = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES (?, ?, ?, ?, 'alumni', FALSE)`,
      [email, passwordHash, firstName, lastName]
    );
    const userId = result.insertId;
    const token = await emailService.createVerificationToken(userId);
    await emailService.sendVerificationEmail(email, token, firstName);
    logger.controller.info('authController.register', 'Registration successful', email);
    res.status(201).json({ success: true, message: 'Registration successful. Please check your email to verify your account.', data: { userId, email } });
  } catch (error) {
    logger.controller.error('authController.register', 'Registration error', error);
    res.status(500).json({ success: false, message: 'An error occurred during registration' });
  }
};

const verifyEmail = async (req, res) => {
  logger.controller.info('authController.verifyEmail', 'Verify email attempt');
  try {
    const { token } = req.params;
    const userId = await emailService.verifyToken(token);
    if (!userId) {
      logger.controller.info('authController.verifyEmail', 'Invalid or expired token');
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }
    logger.repo.info('authController.verifyEmail', 'Updating user verification status');
    await db.query('UPDATE users SET is_verified = TRUE WHERE user_id = ?', [userId]);
    await db.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId]);
    logger.controller.info('authController.verifyEmail', 'Email verified successfully', userId);
    res.status(200).json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    logger.controller.error('authController.verifyEmail', 'Email verification error', error);
    res.status(500).json({ success: false, message: 'An error occurred during email verification' });
  }
};

const login = async (req, res) => {
  logger.controller.info('authController.login', 'Login attempt');
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT user_id, email, password_hash, first_name, last_name, role, is_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      logger.controller.info('authController.login', 'Login failed - User not found');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const user = users[0];
    if (!user.is_verified) {
      logger.controller.info('authController.login', 'Login failed - Email not verified');
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      logger.controller.info('authController.login', 'Login failed - Invalid password');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    req.session.userId = user.user_id;
    req.session.email = user.email;
    req.session.role = user.role;
    logger.controller.info('authController.login', 'Login successful', user.email);
    res.status(200).json({ success: true, message: 'Login successful', data: { token, user: { userId: user.user_id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } } });
  } catch (error) {
    logger.controller.error('authController.login', 'Login error', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
};

const logout = async (req, res) => {
  logger.controller.info('authController.logout', 'Logout attempt');
  try {
    req.session.destroy((err) => { 
      if (err) logger.controller.error('authController.logout', 'Session destruction error', err); 
    });
    logger.controller.info('authController.logout', 'Logout successful');
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    logger.controller.error('authController.logout', 'Logout error', error);
    res.status(500).json({ success: false, message: 'An error occurred during logout' });
  }
};

const resendVerification = async (req, res) => {
  logger.controller.info('authController.resendVerification', 'Resend verification attempt');
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT user_id, first_name, is_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = users[0];
    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified' });
    }
    const token = await emailService.createVerificationToken(user.user_id);
    await emailService.sendVerificationEmail(email, token, user.first_name);
    logger.controller.info('authController.resendVerification', 'Verification email sent successfully');
    res.status(200).json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    logger.controller.error('authController.resendVerification', 'Resend verification error', error);
    res.status(500).json({ success: false, message: 'An error occurred while resending verification email' });
  }
};

module.exports = { register, verifyEmail, login, logout, resendVerification };
