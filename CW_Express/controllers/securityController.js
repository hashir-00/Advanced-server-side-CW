const crypto = require('crypto');
const dbPool = require('../config/dbConfig');
const logger = require('../utils/logger');

const securityController = {
  getMyKeys: async (req, res) => {
    const userId = req.user.userId;
    logger.controller.info('securityController.getMyKeys', 'Fetching API keys', userId);
    try {
      const [keys] = await dbPool.execute(
        'SELECT key_id, name, scopes, is_active, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      res.json({ success: true, data: keys });
    } catch (error) {
      logger.controller.error('securityController.getMyKeys', 'Error fetching keys', error);
      res.status(500).json({ success: false, message: 'Failed to fetch API keys' });
    }
  },

  createKey: async (req, res) => {
    const userId = req.user.userId;
    const { name, scopes } = req.body;
    if (!name || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return res.status(400).json({ success: false, message: 'name and scopes (array) are required' });
    }
    const validScopes = ['read:alumni', 'read:analytics', 'read:alumni_of_day'];
    const invalid = scopes.filter(s => !validScopes.includes(s));
    if (invalid.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid scopes: ${invalid.join(', ')}. Valid: ${validScopes.join(', ')}` });
    }
    logger.controller.info('securityController.createKey', 'Creating API key', { userId, name, scopes });
    try {
      const rawKey = `ak_${crypto.randomBytes(24).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
      const [result] = await dbPool.execute(
        'INSERT INTO api_keys (user_id, key_hash, name, scopes) VALUES (?, ?, ?, ?)',
        [userId, keyHash, name, JSON.stringify(scopes)]
      );
      logger.controller.info('securityController.createKey', 'API key created', result.insertId);
      res.status(201).json({
        success: true,
        message: 'API key created. Save this key — it will not be shown again.',
        data: { key_id: result.insertId, name, scopes, rawKey }
      });
    } catch (error) {
      logger.controller.error('securityController.createKey', 'Error creating key', error);
      res.status(500).json({ success: false, message: 'Failed to create API key' });
    }
  },

  revokeKey: async (req, res) => {
    const userId = req.user.userId;
    const { keyId } = req.params;
    logger.controller.info('securityController.revokeKey', 'Revoking API key', { userId, keyId });
    try {
      const [keys] = await dbPool.execute('SELECT user_id FROM api_keys WHERE key_id = ?', [keyId]);
      if (keys.length === 0) return res.status(404).json({ success: false, message: 'Key not found' });
      if (keys[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
      await dbPool.execute('UPDATE api_keys SET is_active = FALSE WHERE key_id = ?', [keyId]);
      logger.controller.info('securityController.revokeKey', 'Key revoked');
      res.json({ success: true, message: 'API key revoked successfully' });
    } catch (error) {
      logger.controller.error('securityController.revokeKey', 'Error revoking key', error);
      res.status(500).json({ success: false, message: 'Failed to revoke API key' });
    }
  },

  getUsageLogs: async (req, res) => {
    const userId = req.user.userId;
    const { keyId, limit = 50 } = req.query;
    logger.controller.info('securityController.getUsageLogs', 'Fetching usage logs', { userId, keyId });
    try {
      let query = `
        SELECT l.log_id, l.endpoint, l.method, l.status_code, l.timestamp,
               k.name as key_name, k.key_id
        FROM api_usage_logs l
        JOIN api_keys k ON l.key_id = k.key_id
        WHERE k.user_id = ?`;
      const params = [userId];
      if (keyId) { query += ' AND l.key_id = ?'; params.push(keyId); }
      query += ' ORDER BY l.timestamp DESC LIMIT ?';
      params.push(parseInt(limit));

      const [logs] = await dbPool.execute(query, params);

      const [stats] = await dbPool.execute(`
        SELECT k.key_id, k.name,
               COUNT(l.log_id) as total_requests,
               SUM(CASE WHEN l.status_code < 400 THEN 1 ELSE 0 END) as successful,
               SUM(CASE WHEN l.status_code >= 400 THEN 1 ELSE 0 END) as failed,
               MAX(l.timestamp) as last_request
        FROM api_keys k
        LEFT JOIN api_usage_logs l ON k.key_id = l.key_id
        WHERE k.user_id = ?
        GROUP BY k.key_id, k.name`, [userId]);

      logger.controller.info('securityController.getUsageLogs', `Returning ${logs.length} log entries`);
      res.json({ success: true, data: { logs, stats } });
    } catch (error) {
      logger.controller.error('securityController.getUsageLogs', 'Error fetching logs', error);
      res.status(500).json({ success: false, message: 'Failed to fetch usage logs' });
    }
  },

  getAllUsageLogs: async (req, res) => {
    logger.controller.info('securityController.getAllUsageLogs', 'Admin: fetching all usage logs');
    try {
      const [logs] = await dbPool.execute(`
        SELECT l.log_id, l.endpoint, l.method, l.status_code, l.timestamp,
               k.name as key_name, k.key_id, u.email as owner_email
        FROM api_usage_logs l
        JOIN api_keys k ON l.key_id = k.key_id
        JOIN users u ON k.user_id = u.user_id
        ORDER BY l.timestamp DESC LIMIT 200`);

      const [stats] = await dbPool.execute(`
        SELECT k.key_id, k.name, u.email as owner_email, k.scopes,
               COUNT(l.log_id) as total_requests,
               MAX(l.timestamp) as last_request, k.is_active
        FROM api_keys k
        LEFT JOIN api_usage_logs l ON k.key_id = l.key_id
        JOIN users u ON k.user_id = u.user_id
        GROUP BY k.key_id, k.name, u.email, k.scopes, k.is_active
        ORDER BY total_requests DESC`);

      res.json({ success: true, data: { logs, stats } });
    } catch (error) {
      logger.controller.error('securityController.getAllUsageLogs', 'Error fetching admin logs', error);
      res.status(500).json({ success: false, message: 'Failed to fetch usage logs' });
    }
  }
};

module.exports = securityController;
