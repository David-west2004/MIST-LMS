const express = require('express');
const router = express.Router();
const { getAllStudents, toggleBlockStudent, updateStudentUnit, updateStudent } = require('../controller/studentController');
const { protect, restrictTo } = require('../middleware/auth');

// Protect all student routes for Supervisor only
router.use(protect, restrictTo('supervisor'));

router.get('/', getAllStudents);
router.put('/:id', updateStudent);
router.patch('/:id/block', toggleBlockStudent);
router.patch('/:id/unit', updateStudentUnit);

module.exports = router;
