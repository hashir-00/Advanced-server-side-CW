const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');
const { uploadProfileImage, handleUploadError } = require('../middleware/upload');
const { profileUpdateValidation, educationValidation, experienceValidation } = require('../middleware/validator');

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/', profileController.getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               linkedinUrl:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/', uploadProfileImage, handleUploadError, profileUpdateValidation, profileController.updateProfile);

/**
 * @swagger
 * /api/profile/education:
 *   post:
 *     summary: Add education
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - institution
 *               - degree
 *             properties:
 *               institution:
 *                 type: string
 *               degree:
 *                 type: string
 *               fieldOfStudy:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Education added successfully
 */
router.post('/education', educationValidation, profileController.addEducation);

/**
 * @swagger
 * /api/profile/education/{id}:
 *   put:
 *     summary: Update education
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Education updated successfully
 */
router.put('/education/:id', educationValidation, profileController.updateEducation);

/**
 * @swagger
 * /api/profile/education/{id}:
 *   delete:
 *     summary: Delete education
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Education deleted successfully
 */
router.delete('/education/:id', profileController.deleteEducation);

/**
 * @swagger
 * /api/profile/experience:
 *   post:
 *     summary: Add experience
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Experience added successfully
 */
router.post('/experience', experienceValidation, profileController.addExperience);

/**
 * @swagger
 * /api/profile/experience/{id}:
 *   put:
 *     summary: Update experience
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Experience updated successfully
 */
router.put('/experience/:id', experienceValidation, profileController.updateExperience);

/**
 * @swagger
 * /api/profile/experience/{id}:
 *   delete:
 *     summary: Delete experience
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Experience deleted successfully
 */
router.delete('/experience/:id', profileController.deleteExperience);

module.exports = router;
