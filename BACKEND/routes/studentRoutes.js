const express = require('express');
const router = express.Router();
const { getAllStudents, toggleBlockStudent, updateStudentUnit } = require('../controller/studentController');
const { protect, restrictTo } = require('../middleware/auth');

// Protect all student routes for Admin only
router.use(protect, restrictTo('admin'));

router.get('/', getAllStudents);
router.patch('/:id/block', toggleBlockStudent);
router.patch('/:id/unit', updateStudentUnit);

module.exports = router;
