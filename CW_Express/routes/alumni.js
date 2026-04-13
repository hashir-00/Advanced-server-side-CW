const express = require('express');
const router = express.Router();
const alumniController = require('../controllers/alumniController');
const { verifyToken } = require('../middleware/auth');

router.get('/directory', verifyToken, alumniController.getAllAlumni);
router.get('/filters', verifyToken, alumniController.getFilters);

module.exports = router;
