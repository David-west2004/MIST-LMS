const express = require('express');
const router = express.Router();
const {
  createCurriculum,
  getCurricula,
  getCurriculumByUnit,
  getMyCurriculum,
  updateCurriculum,
  deleteCurriculum,
  uploadMaterial
} = require('../controller/curriculumController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Student-accessible route to get their own unit's curriculum
router.get('/my-unit', protect, getMyCurriculum);

// Admin-only routes
router.use(protect, restrictTo('admin'));

router.post('/upload', upload.single('file'), uploadMaterial);

router.route('/')
  .post(createCurriculum)
  .get(getCurricula);

router.route('/:id')
  .put(updateCurriculum)
  .delete(deleteCurriculum);

router.route('/unit/:unit')
  .get(getCurriculumByUnit);

module.exports = router;
