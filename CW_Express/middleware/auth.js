const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/dbConfig');

/**
 * Authentication middleware
 */

// Verify JWT token from Authorization header
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if user still exists and is verified
    const [users] = await db.query(
      'SELECT user_id, email, role, is_verified FROM users WHERE user_id = ?',
      [decoded.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    const user = users[0];
    
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource.'
      });
    }
    
    // Attach user info to request
    req.user = {
      userId: user.user_id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Verify session (alternative to JWT)
const verifySession = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login.'
    });
  }
  
  req.user = {
    userId: req.session.userId,
    email: req.session.email,
    role: req.session.role
  };
  
  next();
};

// Role-based access control
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    
    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = requireRole('admin');

// Middleware to check if user is alumni (or admin)
const requireAlumni = requireRole('alumni', 'admin');

module.exports = {
  verifyToken,
  verifySession,
  requireRole,
  requireAdmin,
  requireAlumni
};
