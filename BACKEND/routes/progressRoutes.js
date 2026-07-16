const express = require('express');
const router = express.Router();
const { toggleMaterialStatus, getMyProgress, getStudentProgress } = require('../controller/progressController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/toggle', protect, toggleMaterialStatus);
router.get('/my-progress', protect, getMyProgress);
router.get('/student/:studentId', protect, restrictTo('admin'), getStudentProgress);

module.exports = router;
