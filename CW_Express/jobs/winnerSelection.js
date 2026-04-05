const cron = require('node-cron');
const db = require('../config/dbConfig');
const emailService = require('../services/emailService');

/**
 * Daily Winner Selection Job
 * Runs every day at midnight to select the highest bidder for the next day
 */

const selectDailyWinner = async () => {
  try {
    console.log('Running daily winner selection job...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // Check if winner already selected for tomorrow
    const [existingWinners] = await db.query(
      'SELECT winner_id FROM daily_winners WHERE winner_date = ?',
      [tomorrowDate]
    );
    
    if (existingWinners.length > 0) {
      console.log(`Winner already selected for ${tomorrowDate}`);
      return;
    }
    
    // Get highest bid for tomorrow
    const [highestBids] = await db.query(
      `SELECT b.bid_id, b.user_id, b.bid_amount, u.email, u.first_name
       FROM bids b
       JOIN users u ON b.user_id = u.user_id
       WHERE b.target_date = ? AND b.status = 'active'
       ORDER BY b.bid_amount DESC
       LIMIT 1`,
      [tomorrowDate]
    );
    
    if (highestBids.length === 0) {
      console.log(`No bids found for ${tomorrowDate}`);
      return;
    }
    
    const winner = highestBids[0];
    
    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert winner record
      await connection.query(
        `INSERT INTO daily_winners (user_id, bid_id, winner_date, winning_bid_amount)
         VALUES (?, ?, ?, ?)`,
        [winner.user_id, winner.bid_id, tomorrowDate, winner.bid_amount]
      );
      
      // Update winning bid status
      await connection.query(
        `UPDATE bids SET status = 'won' WHERE bid_id = ?`,
        [winner.bid_id]
      );
      
      // Update losing bids for the same date
      await connection.query(
        `UPDATE bids SET status = 'lost' 
         WHERE target_date = ? AND bid_id != ? AND status = 'active'`,
        [tomorrowDate, winner.bid_id]
      );
      
      await connection.commit();
      
      console.log(`✓ Winner selected for ${tomorrowDate}: User ${winner.user_id} with bid $${winner.bid_amount}`);
      
      // Send notification email to winner
      await emailService.sendWinnerNotification(
        winner.email,
        winner.first_name,
        tomorrowDate,
        winner.bid_amount
      );
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error in daily winner selection:', error);
  }
};

/**
 * Initialize the cron job
 * Runs at midnight every day (00:00)
 */
const initWinnerSelectionJob = () => {
  // Schedule: '0 0 * * *' = At 00:00 (midnight) every day
  cron.schedule('0 0 * * *', selectDailyWinner, {
    timezone: 'Asia/Kolkata' // Adjust timezone as needed
  });
  
  console.log('✓ Daily winner selection job scheduled (runs at midnight)');
};

// Export for manual testing
module.exports = {
  initWinnerSelectionJob,
  selectDailyWinner
};
