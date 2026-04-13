const db = require('../config/dbConfig');
const biddingService = require('../services/biddingService');
const logger = require('../utils/logger');

const placeBid = async (req, res) => {
  logger.controller.info('biddingController.placeBid', 'Place bid attempt', { userId: req.user.userId, amount: req.body.amount });
  try {
    const userId = req.user.userId;
    const { amount, targetDate } = req.body;
    const eligibility = await biddingService.checkEligibility(userId, targetDate);
    if (!eligibility.eligible) {
      return res.status(400).json({ success: false, message: eligibility.reason, data: { winsThisMonth: eligibility.winsThisMonth, limit: eligibility.limit } });
    }
    logger.repo.info('biddingController.placeBid', 'Inserting new bid');
    const [result] = await db.query(`INSERT INTO bids (user_id, bid_amount, target_date, status) VALUES (?, ?, ?, 'active')`, [userId, amount, targetDate]);
    logger.controller.info('biddingController.placeBid', 'Bid placed successfully', result.insertId);
    res.status(201).json({ success: true, message: 'Bid placed successfully', data: { bidId: result.insertId, amount, targetDate } });
  } catch (error) {
    logger.controller.error('biddingController.placeBid', 'Place bid error', error);
    res.status(500).json({ success: false, message: 'An error occurred while placing bid' });
  }
};

const increaseBid = async (req, res) => {
  logger.controller.info('biddingController.increaseBid', 'Increase bid attempt', { userId: req.user.userId, bidId: req.params.bidId });
  try {
    const userId = req.user.userId;
    const bidId = req.params.bidId;
    const { newAmount } = req.body;
    const isOwner = await biddingService.isUserBidOwner(bidId, userId);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only modify your own bids.' });
    }
    const [bids] = await db.query('SELECT bid_amount, status FROM bids WHERE bid_id = ?', [bidId]);
    if (bids.length === 0) {
      return res.status(404).json({ success: false, message: 'Bid not found' });
    }
    const currentBid = bids[0];
    if (currentBid.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Cannot modify a bid that is not active' });
    }
    if (newAmount <= currentBid.bid_amount) {
      return res.status(400).json({ success: false, message: 'New bid amount must be higher than current bid' });
    }
    logger.repo.info('biddingController.increaseBid', 'Updating bid amount');
    await db.query('UPDATE bids SET bid_amount = ? WHERE bid_id = ?', [newAmount, bidId]);
    logger.controller.info('biddingController.increaseBid', 'Bid increased successfully');
    res.status(200).json({ success: true, message: 'Bid increased successfully', data: { bidId, newAmount } });
  } catch (error) {
    logger.controller.error('biddingController.increaseBid', 'Increase bid error', error);
    res.status(500).json({ success: false, message: 'An error occurred while increasing bid' });
  }
};

const getMyBids = async (req, res) => {
  logger.controller.info('biddingController.getMyBids', 'Fetching user bids', req.user.userId);
  try {
    const userId = req.user.userId;
    const bids = await biddingService.getUserBids(userId);
    logger.controller.info('biddingController.getMyBids', 'Successfully fetched bids');
    res.status(200).json({ success: true, data: bids });
  } catch (error) {
    logger.controller.error('biddingController.getMyBids', 'Get my bids error', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching bids' });
  }
};

const checkEligibility = async (req, res) => {
  logger.controller.info('biddingController.checkEligibility', 'Checking bid eligibility', req.user.userId);
  try {
    const userId = req.user.userId;
    const { targetDate } = req.query;
    if (!targetDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const winsThisMonth = await biddingService.getMonthlyWins(userId, year, month);
      const limit = await biddingService.getMonthlyLimit(userId, year, month);
      return res.status(200).json({ success: true, data: { winsThisMonth, limit, remainingSlots: Math.max(0, limit - winsThisMonth) } });
    }
    const eligibility = await biddingService.checkEligibility(userId, targetDate);
    logger.controller.info('biddingController.checkEligibility', 'Eligibility check complete');
    res.status(200).json({ success: true, data: eligibility });
  } catch (error) {
    logger.controller.error('biddingController.checkEligibility', 'Check eligibility error', error);
    res.status(500).json({ success: false, message: 'An error occurred while checking eligibility' });
  }
};

module.exports = { placeBid, increaseBid, getMyBids, checkEligibility };
