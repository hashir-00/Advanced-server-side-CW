const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/keys',           verifyToken, securityController.getMyKeys);
router.post('/keys',          verifyToken, securityController.createKey);
router.delete('/keys/:keyId', verifyToken, securityController.revokeKey);
router.get('/usage',          verifyToken, securityController.getUsageLogs);
router.get('/usage/all',      verifyToken, requireRole('admin'), securityController.getAllUsageLogs);

module.exports = router;
