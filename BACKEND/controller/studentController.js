const { User } = require('../models');
const { calculatePercentage } = require('./progressController');
const { checkClearanceEligibility } = require('./attendanceController');

const getAllStudents = async (req, res) => {
  try {
    const students = await User.findAll({
      where: { role: 'student' },
      attributes: { exclude: ['password'] }
    });

    const enhancedStudents = await Promise.all(students.map(async (studentInstance) => {
      const student = studentInstance.toJSON ? studentInstance.toJSON() : studentInstance;
      const percentage = await calculatePercentage(student.id, student.unit);
      let clearanceEligibility = null;
      try {
        clearanceEligibility = await checkClearanceEligibility(student.id);
      } catch (err) {
        // Silently skip if error
      }
      return {
        ...student,
        _id: student.id,
        progressPercentage: percentage,
        clearanceEligibility
      };
    }));

    return res.status(200).json({
      status: 'success',
      results: enhancedStudents.length,
      data: { students: enhancedStudents }
    });
  } catch (error) {
    console.error('Get all students error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const toggleBlockStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (isBlocked === undefined) {
      return res.status(400).json({ message: 'isBlocked status is required' });
    }

    const student = await User.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role === 'supervisor') {
      return res.status(400).json({ message: 'Cannot block a supervisor' });
    }

    student.isBlocked = isBlocked;
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: `Student status updated to ${isBlocked ? 'blocked' : 'active'}.`,
      data: {
        student: {
          id: student.id,
          _id: student.id,
          name: student.name,
          email: student.email,
          unit: student.unit,
          isBlocked: student.isBlocked
        }
      }
    });
  } catch (error) {
    console.error('Toggle block student error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStudentUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { unit } = req.body;

    if (!unit) {
      return res.status(400).json({ message: 'Unit is required' });
    }

    const student = await User.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.unit = unit;
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: `Student unit updated to "${unit}".`,
      data: {
        student: {
          id: student.id,
          _id: student.id,
          name: student.name,
          email: student.email,
          unit: student.unit
        }
      }
    });
  } catch (error) {
    console.error('Update student unit error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      unit,
      institution,
      matricNumber,
      phoneNumber,
      siwesDuration,
      siwesDurationWeeks,
      siwesStartDate,
      siwesEndDate,
      isClearedForCompletion
    } = req.body;

    const student = await User.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (name) student.name = name.trim();
    if (unit) student.unit = unit.trim();
    if (institution !== undefined) student.institution = institution ? institution.trim() : null;
    if (matricNumber !== undefined) student.matricNumber = matricNumber ? matricNumber.trim() : null;
    if (phoneNumber !== undefined) student.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    if (siwesDuration) student.siwesDuration = siwesDuration;
    if (siwesDurationWeeks) student.siwesDurationWeeks = Number(siwesDurationWeeks);
    if (siwesStartDate) student.siwesStartDate = new Date(siwesStartDate);
    if (siwesEndDate) student.siwesEndDate = new Date(siwesEndDate);
    if (isClearedForCompletion !== undefined) student.isClearedForCompletion = Boolean(isClearedForCompletion);

    await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Student record updated successfully.',
      data: {
        student: {
          id: student.id,
          _id: student.id,
          name: student.name,
          email: student.email,
          unit: student.unit,
          institution: student.institution,
          matricNumber: student.matricNumber,
          phoneNumber: student.phoneNumber,
          siwesDuration: student.siwesDuration,
          siwesDurationWeeks: student.siwesDurationWeeks,
          siwesStartDate: student.siwesStartDate,
          siwesEndDate: student.siwesEndDate,
          isClearedForCompletion: student.isClearedForCompletion
        }
      }
    });
  } catch (error) {
    console.error('Update student error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllStudents,
  toggleBlockStudent,
  updateStudentUnit,
  updateStudent
};
