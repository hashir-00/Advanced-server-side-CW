const db = require('../config/dbConfig');
const fs = require('fs');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [profiles] = await db.query(`SELECT u.user_id, u.email, u.first_name, u.last_name, u.role, u.created_at, p.linkedin_url, p.bio, p.profile_image_path FROM users u LEFT JOIN profiles p ON u.user_id = p.user_id WHERE u.user_id = ?`, [userId]);
    if (profiles.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    const profile = profiles[0];
    const [education] = await db.query(`SELECT education_id, institution, degree, field_of_study, start_date, end_date, description FROM education WHERE user_id = ? ORDER BY start_date DESC`, [userId]);
    const [experience] = await db.query(`SELECT experience_id, company, position, location, start_date, end_date, is_current, description FROM experience WHERE user_id = ? ORDER BY start_date DESC`, [userId]);
    res.status(200).json({ success: true, data: { ...profile, education, experience } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { linkedinUrl, bio } = req.body;
    let profileImagePath = null;
    if (req.file) {
      profileImagePath = req.file.path;
      const [oldProfile] = await db.query('SELECT profile_image_path FROM profiles WHERE user_id = ?', [userId]);
      if (oldProfile.length > 0 && oldProfile[0].profile_image_path) {
        const oldPath = oldProfile[0].profile_image_path;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
    const updateFields = [];
    const updateValues = [];
    if (linkedinUrl !== undefined) { updateFields.push('linkedin_url = ?'); updateValues.push(linkedinUrl); }
    if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio); }
    if (profileImagePath) { updateFields.push('profile_image_path = ?'); updateValues.push(profileImagePath); }
    if (updateFields.length > 0) {
      updateValues.push(userId);
      await db.query(`UPDATE profiles SET ${updateFields.join(', ')} WHERE user_id = ?`, updateValues);
    }
    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating profile' });
  }
};

const addEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    const [result] = await db.query(`INSERT INTO education (user_id, institution, degree, field_of_study, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?, ?)`, [userId, institution, degree, fieldOfStudy, startDate, endDate, description]);
    res.status(201).json({ success: true, message: 'Education added successfully', data: { educationId: result.insertId } });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding education' });
  }
};

const updateEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const educationId = req.params.id;
    const { institution, degree, fieldOfStudy, startDate, endDate, description } = req.body;
    const [education] = await db.query('SELECT user_id FROM education WHERE education_id = ?', [educationId]);
    if (education.length === 0) return res.status(404).json({ success: false, message: 'Education record not found' });
    if (education[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
    await db.query(`UPDATE education SET institution = ?, degree = ?, field_of_study = ?, start_date = ?, end_date = ?, description = ? WHERE education_id = ?`, [institution, degree, fieldOfStudy, startDate, endDate, description, educationId]);
    res.status(200).json({ success: true, message: 'Education updated successfully' });
  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating education' });
  }
};

const deleteEducation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const educationId = req.params.id;
    const [education] = await db.query('SELECT user_id FROM education WHERE education_id = ?', [educationId]);
    if (education.length === 0) return res.status(404).json({ success: false, message: 'Education record not found' });
    if (education[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
    await db.query('DELETE FROM education WHERE education_id = ?', [educationId]);
    res.status(200).json({ success: true, message: 'Education deleted successfully' });
  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting education' });
  }
};

const addExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { company, position, location, startDate, endDate, isCurrent, description } = req.body;
    const [result] = await db.query(`INSERT INTO experience (user_id, company, position, location, start_date, end_date, is_current, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [userId, company, position, location, startDate, endDate, isCurrent || false, description]);
    res.status(201).json({ success: true, message: 'Experience added successfully', data: { experienceId: result.insertId } });
  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding experience' });
  }
};

const updateExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const experienceId = req.params.id;
    const { company, position, location, startDate, endDate, isCurrent, description } = req.body;
    const [experience] = await db.query('SELECT user_id FROM experience WHERE experience_id = ?', [experienceId]);
    if (experience.length === 0) return res.status(404).json({ success: false, message: 'Experience record not found' });
    if (experience[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
    await db.query(`UPDATE experience SET company = ?, position = ?, location = ?, start_date = ?, end_date = ?, is_current = ?, description = ? WHERE experience_id = ?`, [company, position, location, startDate, endDate, isCurrent || false, description, experienceId]);
    res.status(200).json({ success: true, message: 'Experience updated successfully' });
  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating experience' });
  }
};

const deleteExperience = async (req, res) => {
  try {
    const userId = req.user.userId;
    const experienceId = req.params.id;
    const [experience] = await db.query('SELECT user_id FROM experience WHERE experience_id = ?', [experienceId]);
    if (experience.length === 0) return res.status(404).json({ success: false, message: 'Experience record not found' });
    if (experience[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Access denied' });
    await db.query('DELETE FROM experience WHERE experience_id = ?', [experienceId]);
    res.status(200).json({ success: false, message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting experience' });
  }
};

module.exports = { getProfile, updateProfile, addEducation, updateEducation, deleteEducation, addExperience, updateExperience, deleteExperience };
