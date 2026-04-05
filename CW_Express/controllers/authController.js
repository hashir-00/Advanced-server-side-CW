const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/dbConfig');
const config = require('../config/config');
const emailService = require('../services/emailService');

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const [existingUsers] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified) VALUES (?, ?, ?, ?, 'alumni', FALSE)`,
      [email, passwordHash, firstName, lastName]
    );
    const userId = result.insertId;
    const token = await emailService.createVerificationToken(userId);
    await emailService.sendVerificationEmail(email, token, firstName);
    res.status(201).json({ success: true, message: 'Registration successful. Please check your email to verify your account.', data: { userId, email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during registration' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = await emailService.verifyToken(token);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }
    await db.query('UPDATE users SET is_verified = TRUE WHERE user_id = ?', [userId]);
    await db.query('DELETE FROM email_verification_tokens WHERE user_id = ?', [userId]);
    res.status(200).json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during email verification' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.query('SELECT user_id, email, password_hash, first_name, last_name, role, is_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const user = users[0];
    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.user_id, email: user.email, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    req.session.userId = user.user_id;
    req.session.email = user.email;
    req.session.role = user.role;
    res.status(200).json({ success: true, message: 'Login successful', data: { token, user: { userId: user.user_id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => { if (err) console.error('Session destruction error:', err); });
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'An error occurred during logout' });
  }
};

const resendVerification = async (req, res) => {
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
    res.status(200).json({ success: true, message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while resending verification email' });
  }
};

module.exports = { register, verifyEmail, login, logout, resendVerification };
