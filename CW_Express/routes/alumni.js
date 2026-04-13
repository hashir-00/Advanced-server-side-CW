const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/alumniController');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Alumni
 *   description: Alumni Directory
 */

/**
 * @swagger
 * /api/alumni/directory:
 *   get:
 *     summary: Get directory of all verified alumni
 *     tags: [Alumni]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of alumni
 *       401:
 *         description: Unauthorized
 */
router.get('/directory', verifyToken, alumniController.getAllAlumni);

module.exports = router;
