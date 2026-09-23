const express = require('express');
const router = express.Router();
const { checkIn, getMyAttendanceSummary } = require('../controller/attendanceController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('student'));

router.post('/check-in', checkIn);
router.get('/my-summary', getMyAttendanceSummary);

module.exports = router;
