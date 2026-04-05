require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.MYSQL_ROOT_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || '',
    database: process.env.DB_NAME || 'alumni_platform',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  session: {
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000
  },
  
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    from: process.env.EMAIL_FROM || 'noreply@university.edu'
  },
  
  allowedDomains: process.env.ALLOWED_DOMAINS ? 
    process.env.ALLOWED_DOMAINS.split(',') : 
    ['university.edu'],
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : 
      ['http://localhost:3000']
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads/profiles',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
  },
  
  tokenExpiryHours: parseInt(process.env.TOKEN_EXPIRY_HOURS) || 24
};