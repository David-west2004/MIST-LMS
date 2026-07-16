const express = require('express');
const router = express.Router();
const {
  createCurriculum,
  getCurricula,
  getCurriculumByUnit,
  getMyCurriculum,
  updateCurriculum,
  deleteCurriculum
} = require('../controller/curriculumController');
const { protect, restrictTo } = require('../middleware/auth');

// Student-accessible route to get their own unit's curriculum
router.get('/my-unit', protect, getMyCurriculum);

// Admin-only routes
router.use(protect, restrictTo('admin'));

router.route('/')
  .post(createCurriculum)
  .get(getCurricula);

router.route('/:id')
  .put(updateCurriculum)
  .delete(deleteCurriculum);

router.route('/unit/:unit')
  .get(getCurriculumByUnit);

module.exports = router;
