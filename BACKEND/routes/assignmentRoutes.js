const express = require('express');
const router = express.Router();
const {
  getAllAdminAssignments,
  getAssignmentsByUnit,
  getMyAssignments,
  createAssignment,
  deleteAssignment,
  submitAssignment
} = require('../controller/assignmentController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Student endpoints
router.get('/my-unit', protect, getMyAssignments);
router.get('/unit/:unit', protect, getAssignmentsByUnit);
router.post('/:id/submit', protect, upload.single('file'), submitAssignment);

// Admin endpoints
router.get('/', protect, restrictTo('admin'), getAllAdminAssignments);
router.post('/', protect, restrictTo('admin'), createAssignment);
router.delete('/:id', protect, restrictTo('admin'), deleteAssignment);

module.exports = router;
