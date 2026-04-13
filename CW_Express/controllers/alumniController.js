const dbPool = require('../config/dbConfig');
const logger = require('../utils/logger');

const alumniController = {
  getAllAlumni: async (req, res) => {
    const { programme, graduation_year, industry, search } = req.query;
    logger.controller.info('alumniController.getAllAlumni', 'Fetching alumni directory', { programme, graduation_year, industry, search });

    try {
      logger.repo.info('alumniController.getAllAlumni', 'Executing query for verified alumni');
      const [alumniRows] = await dbPool.execute(`
        SELECT DISTINCT
          u.user_id, u.first_name, u.last_name, u.email,
          p.bio, p.linkedin_url, p.profile_image_path
        FROM users u
        LEFT JOIN profiles p ON u.user_id = p.user_id
        WHERE u.role = 'alumni' AND u.is_verified = TRUE
        ORDER BY u.first_name, u.last_name
      `);

      if (alumniRows.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      const userIds = alumniRows.map(a => a.user_id);
      const placeholders = userIds.map(() => '?').join(',');

      logger.repo.info('alumniController.getAllAlumni', `Fetching skills, education, experience for ${userIds.length} users`);

      const [[skills], [education], [experience]] = await Promise.all([
        dbPool.execute(`SELECT user_id, skill_name, proficiency FROM skills WHERE user_id IN (${placeholders})`, userIds),
        dbPool.execute(`SELECT user_id, institution, degree, field_of_study, start_date, end_date FROM education WHERE user_id IN (${placeholders}) ORDER BY end_date DESC`, userIds),
        dbPool.execute(`SELECT user_id, company, position, location, is_current FROM experience WHERE user_id IN (${placeholders})`, userIds)
      ]);

      let alumni = alumniRows.map(alumnus => ({
        ...alumnus,
        skills: skills.filter(s => s.user_id === alumnus.user_id).map(s => s.skill_name),
        education: education.filter(e => e.user_id === alumnus.user_id),
        currentExperience: experience.find(e => e.user_id === alumnus.user_id && e.is_current) || experience.find(e => e.user_id === alumnus.user_id) || null,
        graduationYear: (() => {
          const ed = education.filter(e => e.user_id === alumnus.user_id && e.end_date);
          if (!ed.length) return null;
          return Math.max(...ed.map(e => new Date(e.end_date).getFullYear()));
        })(),
        programme: (() => {
          const ed = education.filter(e => e.user_id === alumnus.user_id && e.end_date);
          if (!ed.length) return null;
          const latest = ed.sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
          return latest.field_of_study || null;
        })(),
        industry: (() => {
          const exp = experience.find(e => e.user_id === alumnus.user_id && e.is_current) || experience.find(e => e.user_id === alumnus.user_id);
          if (!exp) return null;
          const industryMap = {
            'Google': 'Technology', 'Meta': 'Technology', 'Apple': 'Technology', 'Netflix': 'Technology', 'Spotify': 'Technology',
            'Amazon': 'Technology', 'Microsoft': 'Technology',
            'Barclays': 'Finance', 'HSBC': 'Finance', 'Deloitte': 'Consulting', 'PwC': 'Consulting', 'Accenture': 'Consulting'
          };
          return industryMap[exp.company] || 'Other';
        })()
      }));

      if (programme) alumni = alumni.filter(a => a.programme && a.programme.toLowerCase().includes(programme.toLowerCase()));
      if (graduation_year) alumni = alumni.filter(a => a.graduationYear && a.graduationYear === parseInt(graduation_year));
      if (industry) alumni = alumni.filter(a => a.industry && a.industry.toLowerCase() === industry.toLowerCase());
      if (search) {
        const q = search.toLowerCase();
        alumni = alumni.filter(a =>
          `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
          (a.currentExperience?.company || '').toLowerCase().includes(q) ||
          (a.programme || '').toLowerCase().includes(q)
        );
      }

      logger.controller.info('alumniController.getAllAlumni', `Returning ${alumni.length} alumni`);
      res.status(200).json({ success: true, total: alumni.length, data: alumni });
    } catch (error) {
      logger.controller.error('alumniController.getAllAlumni', 'Failed to fetch alumni', error);
      res.status(500).json({ success: false, message: 'Failed to fetch alumni directory' });
    }
  },

  getFilters: async (req, res) => {
    logger.controller.info('alumniController.getFilters', 'Fetching filter options');
    try {
      const [[programmes], [years], [industries]] = await Promise.all([
        dbPool.execute(`SELECT DISTINCT field_of_study FROM education WHERE field_of_study IS NOT NULL ORDER BY field_of_study`),
        dbPool.execute(`SELECT DISTINCT YEAR(end_date) as year FROM education WHERE end_date IS NOT NULL ORDER BY year DESC`),
        dbPool.execute(`SELECT DISTINCT company FROM experience WHERE is_current = TRUE ORDER BY company`)
      ]);

      const industryMap = {
        'Google': 'Technology', 'Meta': 'Technology', 'Apple': 'Technology', 'Netflix': 'Technology',
        'Spotify': 'Technology', 'Amazon': 'Technology', 'Microsoft': 'Technology',
        'Barclays': 'Finance', 'HSBC': 'Finance', 'Deloitte': 'Consulting', 'PwC': 'Consulting', 'Accenture': 'Consulting'
      };
      const uniqueIndustries = [...new Set(industries.map(r => industryMap[r.company] || 'Other'))].sort();

      res.status(200).json({
        success: true,
        data: {
          programmes: programmes.map(r => r.field_of_study),
          graduationYears: years.map(r => r.year),
          industries: uniqueIndustries
        }
      });
    } catch (error) {
      logger.controller.error('alumniController.getFilters', 'Failed to fetch filter options', error);
      res.status(500).json({ success: false, message: 'Failed to fetch filter options' });
    }
  }
};

module.exports = alumniController;
