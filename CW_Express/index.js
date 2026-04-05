const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const config = require('./config/config');
const { helmetConfig, corsConfig, limiter } = require('./middleware/security');
const { specs, swaggerUi } = require('./swagger/swagger');
const { initWinnerSelectionJob } = require('./jobs/winnerSelection');
const dbPool = require('./config/dbConfig');

// Initialize database connection
require('./config/dbConfig');

const app = express();
const port = config.port;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet for security headers
app.use(helmetConfig);

// CORS configuration
app.use(corsConfig);

// Rate limiting
app.use('/api/', limiter);

// ============================================================
// BODY PARSING MIDDLEWARE
// ============================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// SESSION MANAGEMENT
// ============================================================

const sessionStore = new MySQLStore(
  {
    createDatabaseTable: false,
    schema: {
      tableName: 'sessions'
    }
  },
  dbPool
);

app.use(session({
  secret: config.session.secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: config.session.maxAge
  }
}));

// ============================================================
// STATIC FILES
// ============================================================

app.use('/uploads', express.static('uploads'));

// ============================================================
// API DOCUMENTATION
// ============================================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Alumni Platform API Docs'
}));

// ============================================================
// API ROUTES
// ============================================================

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const biddingRoutes = require('./routes/bidding');
const v1Routes = require('./router');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bidding', biddingRoutes);
app.use('/api/v1', v1Routes);

// ============================================================
// ROOT ENDPOINT
// ============================================================

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Alumni Influencer Platform API',
    version: '1.0.0',
    documentation: `http://localhost:${port}/api-docs`,
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      bidding: '/api/bidding'
    }
  });
});

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(port, () => {
  console.log('='.repeat(50));
  console.log('🚀 Alumni Influencer Platform API');
  console.log('='.repeat(50));
  console.log(`✓ Server running on port ${port}`);
  console.log(`✓ Environment: ${config.nodeEnv}`);
  console.log(`✓ API Documentation: http://localhost:${port}/api-docs`);
  console.log('='.repeat(50));
  
  // Initialize scheduled jobs
  initWinnerSelectionJob();
});