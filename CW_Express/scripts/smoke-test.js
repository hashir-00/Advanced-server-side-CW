const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const requiredFiles = [
  'index.js',
  'routes/auth.js',
  'routes/profile.js',
  'routes/bidding.js',
  'controllers/authController.js',
  'controllers/profileController.js',
  'controllers/biddingController.js',
  'jobs/winnerSelection.js',
  'swagger/swagger.js',
  'database/schema.sql'
];

const checks = [
  {
    name: 'Main API routes are mounted',
    file: 'index.js',
    includes: ["app.use('/api/auth'", "app.use('/api/profile'", "app.use('/api/bidding'"]
  },
  {
    name: 'Versioned scaffold routes are mounted',
    file: 'index.js',
    includes: ["app.use('/api/v1'", "const v1Routes = require('./router')"]
  },
  {
    name: 'Session uses MySQL store',
    file: 'index.js',
    includes: ["express-mysql-session", 'store: sessionStore']
  },
  {
    name: 'Winner selection job initializes',
    file: 'index.js',
    includes: ['initWinnerSelectionJob();']
  },
  {
    name: 'Schema contains sessions table definition',
    file: 'database/schema.sql',
    includes: ['CREATE TABLE sessions', 'session_id', 'expires']
  }
];

function read(relativeFile) {
  const filePath = path.join(root, relativeFile);
  return fs.readFileSync(filePath, 'utf8');
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`✓ ${message}`);
}

for (const file of requiredFiles) {
  const absolutePath = path.join(root, file);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing required file: ${file}`);
  } else {
    pass(`Found file: ${file}`);
  }
}

for (const check of checks) {
  const content = read(check.file);
  const missing = check.includes.filter((entry) => !content.includes(entry));
  if (missing.length > 0) {
    fail(`${check.name} (missing: ${missing.join(', ')})`);
  } else {
    pass(check.name);
  }
}

if (process.exitCode && process.exitCode !== 0) {
  console.error('\nSmoke test failed.');
  process.exit(process.exitCode);
}

console.log('\nAll smoke checks passed.');