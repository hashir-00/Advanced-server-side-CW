const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const requireApiKey = require('../middleware/apiKeyAuth');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Dashboard analytics data
 */

/**
 * @swagger
 * /api/analytics/stats:
 *   get:
 *     summary: Get summary statistics for dashboard cards
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary stats
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', verifyToken, analyticsController.getDashboardStats);

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get full analytics charts data (requires API key)
 *     tags: [Analytics]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Analytics data for charts
 *       403:
 *         description: Access Denied
 */
router.get('/dashboard', requireApiKey('read:analytics'), analyticsController.getDashboardData);

/**
 * @swagger
 * /api/analytics/charts:
 *   get:
 *     summary: Get full analytics charts data (JWT authenticated)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data for charts
 *       401:
 *         description: Unauthorized
 */
router.get('/charts', verifyToken, analyticsController.getDashboardData);

module.exports = router;
