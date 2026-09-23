const express = require('express');
const router = express.Router();
const { requestCompletionLetter, getClearanceStatus } = require('../controller/clearanceController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('student'));

router.post('/request-letter', requestCompletionLetter);
router.get('/status', getClearanceStatus);

module.exports = router;
