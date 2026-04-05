const db = require('../config/dbConfig');

/**
 * Bidding Service - Business logic for blind bidding system
 */

/**
 * Get monthly wins count for a user
 * @param {number} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<number>} Number of wins
 */
const getMonthlyWins = async (userId, year, month) => {
  const [result] = await db.query(
    'SELECT count_monthly_wins(?, ?, ?) as win_count',
    [userId, year, month]
  );
  return result[0].win_count;
};

/**
 * Get monthly win limit for a user (3 or 4 if attended event)
 * @param {number} userId - User ID
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Promise<number>} Win limit
 */
const getMonthlyLimit = async (userId, year, month) => {
  const [result] = await db.query(
    'SELECT get_monthly_limit(?, ?, ?) as win_limit',
    [userId, year, month]
  );
  return result[0].win_limit;
};

/**
 * Check if user is eligible to place a bid
 * @param {number} userId - User ID
 * @param {Date} targetDate - Target date for bid
 * @returns {Promise<{eligible: boolean, reason: string, winsThisMonth: number, limit: number}>}
 */
const checkEligibility = async (userId, targetDate) => {
  const date = new Date(targetDate);
  
  if (isNaN(date.getTime())) {
    return {
      eligible: false,
      reason: 'Invalid date format provided',
      winsThisMonth: 0,
      limit: 0
    };
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const formattedDate = date.toISOString().split('T')[0];
  
  const winsThisMonth = await getMonthlyWins(userId, year, month);
  const limit = await getMonthlyLimit(userId, year, month);
  
  if (winsThisMonth >= limit) {
    return {
      eligible: false,
      reason: `You have reached your monthly limit of ${limit} wins`,
      winsThisMonth,
      limit
    };
  }
  
  // Check if user already has an active bid for this date
  const [existingBids] = await db.query(
    `SELECT bid_id FROM bids 
     WHERE user_id = ? AND target_date = ? AND status = 'active'`,
    [userId, formattedDate]
  );
  
  if (existingBids.length > 0) {
    return {
      eligible: false,
      reason: 'You already have an active bid for this date',
      winsThisMonth,
      limit
    };
  }
  
  // Check if this date already has a winner
  const [winners] = await db.query(
    'SELECT winner_id FROM daily_winners WHERE winner_date = ?',
    [formattedDate]
  );
  
  if (winners.length > 0) {
    return {
      eligible: false,
      reason: 'This date already has a winner',
      winsThisMonth,
      limit
    };
  }
  
  return {
    eligible: true,
    reason: 'Eligible to bid',
    winsThisMonth,
    limit
  };
};

/**
 * Get user's own bids (for transparency)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} User's bids
 */
const getUserBids = async (userId) => {
  const [bids] = await db.query(
    `SELECT bid_id, bid_amount, target_date, status, created_at, updated_at
     FROM bids
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return bids;
};

/**
 * Check if user owns a bid
 * @param {number} bidId - Bid ID
 * @param {number} userId - User ID
 * @returns {Promise<boolean>}
 */
const isUserBidOwner = async (bidId, userId) => {
  const [bids] = await db.query(
    'SELECT user_id FROM bids WHERE bid_id = ?',
    [bidId]
  );
  
  return bids.length > 0 && bids[0].user_id === userId;
};

module.exports = {
  getMonthlyWins,
  getMonthlyLimit,
  checkEligibility,
  getUserBids,
  isUserBidOwner
};
