const express = require('express');
const router = express.Router();
const { requestCompletionLetter, getClearanceStatus, approveClearance } = require('../controller/clearanceController');
const { protect, restrictTo } = require('../middleware/auth');

// Student clearance letter generation
router.post('/request-letter', protect, restrictTo('student'), requestCompletionLetter);

// Clearance status: accessible by student (own) or supervisor (own/by studentId)
router.get('/status', protect, getClearanceStatus);
router.get('/status/:studentId', protect, restrictTo('supervisor'), getClearanceStatus);

// Supervisor clearance approval
router.post('/approve/:studentId', protect, restrictTo('supervisor'), approveClearance);

module.exports = router;
