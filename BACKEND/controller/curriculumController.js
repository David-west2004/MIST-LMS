const Curriculum = require('../model/Curriculum');

const createCurriculum = async (req, res) => {
  try {
    const { unit, modules } = req.body;
    if (!unit) {
      return res.status(400).json({ message: 'Unit name is required' });
    }

    const existing = await Curriculum.findOne({ unit });
    if (existing) {
      return res.status(400).json({ message: `Curriculum for unit "${unit}" already exists` });
    }

    const curriculum = await Curriculum.create({
      unit,
      modules: modules || []
    });

    return res.status(201).json({
      status: 'success',
      data: { curriculum }
    });
  } catch (error) {
    console.error('Create curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getCurricula = async (req, res) => {
  try {
    const curricula = await Curriculum.find({});
    return res.status(200).json({
      status: 'success',
      results: curricula.length,
      data: { curricula }
    });
  } catch (error) {
    console.error('Get curricula error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getCurriculumByUnit = async (req, res) => {
  try {
    const { unit } = req.params;
    const curriculum = await Curriculum.findOne({ unit });
    if (!curriculum) {
      return res.status(404).json({ message: `Curriculum for unit "${unit}" not found` });
    }
    return res.status(200).json({
      status: 'success',
      data: { curriculum }
    });
  } catch (error) {
    console.error('Get curriculum by unit error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyCurriculum = async (req, res) => {
  try {
    const unit = req.user.unit;
    const curriculum = await Curriculum.findOne({ unit });
    if (!curriculum) {
      return res.status(404).json({ message: `Curriculum for unit "${unit}" has not been created yet.` });
    }
    return res.status(200).json({
      status: 'success',
      data: { curriculum }
    });
  } catch (error) {
    console.error('Get my curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit, modules } = req.body;

    const curriculum = await Curriculum.findById(id);
    if (!curriculum) {
      return res.status(404).json({ message: 'Curriculum not found' });
    }

    if (unit) {
      if (unit !== curriculum.unit) {
        const existing = await Curriculum.findOne({ unit });
        if (existing) {
          return res.status(400).json({ message: `Curriculum for unit "${unit}" already exists` });
        }
      }
      curriculum.unit = unit;
    }

    if (modules) {
      curriculum.modules = modules;
    }

    await curriculum.save();

    return res.status(200).json({
      status: 'success',
      data: { curriculum }
    });
  } catch (error) {
    console.error('Update curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteCurriculum = async (req, res) => {
  try {
    const { id } = req.params;
    const curriculum = await Curriculum.findByIdAndDelete(id);
    if (!curriculum) {
      return res.status(404).json({ message: 'Curriculum not found' });
    }
    return res.status(200).json({
      status: 'success',
      message: 'Curriculum deleted successfully'
    });
  } catch (error) {
    console.error('Delete curriculum error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCurriculum,
  getCurricula,
  getCurriculumByUnit,
  getMyCurriculum,
  updateCurriculum,
  deleteCurriculum
};
