const dbPool = require('../config/dbConfig');

const alumniController = {
  getAllAlumni: async (req, res, next) => {
    try {
      const [alumniRows] = await dbPool.execute(`
        SELECT 
          u.user_id, u.first_name, u.last_name, u.email,
          p.bio, p.linkedin_url, p.profile_image_path
        FROM users u
        LEFT JOIN profiles p ON u.user_id = p.user_id
        WHERE u.role = 'alumni' AND u.is_verified = TRUE
      `);

      const userIds = alumniRows.map(a => a.user_id);
      
      let skillsData = [];
      let expData = [];
      
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        const [skills] = await dbPool.execute(`SELECT user_id, skill_name, proficiency FROM skills WHERE user_id IN (${placeholders})`, userIds);
        skillsData = skills;

        const [experiences] = await dbPool.execute(`SELECT user_id, company, position, is_current FROM experience WHERE user_id IN (${placeholders}) AND is_current = TRUE`, userIds);
        expData = experiences;
      }

      const formattedAlumni = alumniRows.map(alumnus => ({
        ...alumnus,
        skills: skillsData.filter(s => s.user_id === alumnus.user_id).map(s => s.skill_name),
        currentExperience: expData.find(e => e.user_id === alumnus.user_id) || null
      }));

      res.status(200).json({
        success: true,
        data: formattedAlumni
      });
    } catch (error) {
      console.error('Alumni directory error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch alumni directory' });
    }
  }
};

module.exports = alumniController;
