const express = require('express');
const router = express.Router();
const {
  getAllAdminAssignments,
  getAssignmentsByUnit,
  getMyAssignments,
  createAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission
} = require('../controller/assignmentController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Student endpoints
router.get('/my-unit', protect, getMyAssignments);
router.get('/unit/:unit', protect, getAssignmentsByUnit);
router.post('/:id/submit', protect, upload.single('file'), submitAssignment);

// Supervisor endpoints
router.get('/', protect, restrictTo('supervisor'), getAllAdminAssignments);
router.post('/', protect, restrictTo('supervisor'), createAssignment);
router.delete('/:id', protect, restrictTo('supervisor'), deleteAssignment);
router.put('/submissions/:submissionId/grade', protect, restrictTo('supervisor'), gradeSubmission);

module.exports = router;
