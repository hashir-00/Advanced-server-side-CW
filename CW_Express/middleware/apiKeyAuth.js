const dbPool = require('../config/dbConfig');
const crypto = require('crypto');

/**
 * API Key Middleware with Scope Validation
 * @param {string} requiredScope - Scope required to access the endpoint
 */
const requireApiKey = (requiredScope) => {
  return async (req, res, next) => {
    try {
      const apiKey = req.header('X-API-Key');
      
      if (!apiKey) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: API Key is missing. Please provide a valid X-API-Key header.'
        });
      }

      // Hash the provided API key to compare with the DB (since we store it hashed)
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Check DB for API Key
      const [rows] = await dbPool.execute(
        'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = TRUE',
        [keyHash]
      );

      if (rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Invalid or inactive API Key.'
        });
      }

      const apiKeyData = rows[0];
      const scopes = apiKeyData.scopes || []; // Expected to be JSON array of scopes

      // Verify required scope
      if (requiredScope && !scopes.includes(requiredScope)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: API Key lacks the required scope '${requiredScope}'`
        });
      }

      // Track API usage asynchronously
      dbPool.execute(
        'INSERT INTO api_usage_logs (key_id, endpoint, method, status_code) VALUES (?, ?, ?, ?)',
        [apiKeyData.key_id, req.originalUrl, req.method, 200]
      ).catch(err => console.error('Failed to log API usage:', err));

      // Update last_used_at
      dbPool.execute(
        'UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key_id = ?',
        [apiKeyData.key_id]
      ).catch(err => console.error('Failed to update last_used_at:', err));

      // Assign user context implicitly to the request
      req.apiUser = { user_id: apiKeyData.user_id };
      
      next();
    } catch (error) {
      console.error('API Key Middleware Error:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  };
};

module.exports = requireApiKey;
