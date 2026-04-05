const { body, param, query, validationResult } = require('express-validator');
const config = require('../config/config');

/**
 * Validation middleware and helpers
 */

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Email domain validator
const isUniversityEmail = (email) => {
  const domain = email.split('@')[1];
  return config.allowedDomains.includes(domain);
};

// Validation rules for user registration
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .custom((email) => {
      if (!isUniversityEmail(email)) {
        throw new Error(`Email must be from one of these domains: ${config.allowedDomains.join(', ')}`);
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters')
    .escape(),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters')
    .escape(),
  validate
];

// Validation rules for login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// Validation rules for profile update
const profileUpdateValidation = [
  body('linkedinUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL')
    .contains('linkedin.com')
    .withMessage('URL must be a LinkedIn profile'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters')
    .escape(),
  validate
];

// Validation rules for education
const educationValidation = [
  body('institution')
    .trim()
    .notEmpty()
    .withMessage('Institution is required')
    .isLength({ max: 255 })
    .withMessage('Institution name must not exceed 255 characters')
    .escape(),
  body('degree')
    .trim()
    .notEmpty()
    .withMessage('Degree is required')
    .isLength({ max: 255 })
    .withMessage('Degree must not exceed 255 characters')
    .escape(),
  body('fieldOfStudy')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Field of study must not exceed 255 characters')
    .escape(),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.startDate && new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .escape(),
  validate
];

// Validation rules for experience
const experienceValidation = [
  body('company')
    .trim()
    .notEmpty()
    .withMessage('Company is required')
    .isLength({ max: 255 })
    .withMessage('Company name must not exceed 255 characters')
    .escape(),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required')
    .isLength({ max: 255 })
    .withMessage('Position must not exceed 255 characters')
    .escape(),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters')
    .escape(),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.startDate && new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('isCurrent')
    .optional()
    .isBoolean()
    .withMessage('isCurrent must be a boolean'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
    .escape(),
  validate
];

// Validation rules for bidding
const bidValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Bid amount must be a positive number'),
  body('targetDate')
    .isISO8601()
    .withMessage('Please provide a valid target date')
    .custom((targetDate) => {
      const date = new Date(targetDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (date < tomorrow) {
        throw new Error('Target date must be at least tomorrow');
      }
      return true;
    }),
  validate
];

// Validation rules for bid increase
const bidIncreaseValidation = [
  param('bidId')
    .isInt({ min: 1 })
    .withMessage('Invalid bid ID'),
  body('newAmount')
    .isFloat({ min: 0.01 })
    .withMessage('New bid amount must be a positive number'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  educationValidation,
  experienceValidation,
  bidValidation,
  bidIncreaseValidation
};
