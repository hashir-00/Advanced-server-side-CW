const express = require('express');
const router = express.Router();
const biddingController = require('../controllers/biddingController');
const { verifyToken } = require('../middleware/auth');
const { bidValidation, bidIncreaseValidation } = require('../middleware/validator');

/**
 * @swagger
 * tags:
 *   name: Bidding
 *   description: Blind bidding system for Alumni of the Day
 */

router.use(verifyToken);

/**
 * @swagger
 * /api/bidding/place:
 *   post:
 *     summary: Place a new bid
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - targetDate
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               targetDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *       400:
 *         description: Eligibility check failed
 */
router.post('/place', bidValidation, biddingController.placeBid);

/**
 * @swagger
 * /api/bidding/increase/{bidId}:
 *   put:
 *     summary: Increase an existing bid (blind)
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bidId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAmount
 *             properties:
 *               newAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Bid increased successfully
 *       403:
 *         description: Not your bid
 */
router.put('/increase/:bidId', bidIncreaseValidation, biddingController.increaseBid);

/**
 * @swagger
 * /api/bidding/my-bids:
 *   get:
 *     summary: Get your own bids
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of your bids
 */
router.get('/my-bids', biddingController.getMyBids);

/**
 * @swagger
 * /api/bidding/eligibility:
 *   get:
 *     summary: Check bidding eligibility
 *     tags: [Bidding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: targetDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Eligibility status
 */
router.get('/eligibility', biddingController.checkEligibility);

module.exports = router;
