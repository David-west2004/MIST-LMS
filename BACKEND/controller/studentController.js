const User = require('../model/User');
const { calculatePercentage } = require('./progressController');

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');

    const enhancedStudents = await Promise.all(students.map(async (student) => {
      const percentage = await calculatePercentage(student._id, student.unit);
      return {
        ...student.toObject(),
        progressPercentage: percentage
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

    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.role === 'admin') {
      return res.status(400).json({ message: 'Cannot block an administrator' });
    }

    student.isBlocked = isBlocked;
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: `Student status updated to ${isBlocked ? 'blocked' : 'active'}.`,
      data: {
        student: {
          id: student._id,
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

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Explicitly reject or ignore modifications to the unit field
    if (req.body.unit !== undefined) {
      delete req.body.unit;
    }

    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.body.name) student.name = req.body.name;
    if (req.body.isBlocked !== undefined && student.role !== 'admin') {
      student.isBlocked = req.body.isBlocked;
    }

    await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Student record updated (unit modification is locked and ignored).',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          unit: student.unit,
          isBlocked: student.isBlocked,
          lastActive: student.lastActive
        }
      }
    });
  } catch (error) {
    console.error('Update student error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const updateStudentUnit = async (req, res) => {
  return res.status(400).json({
    status: 'fail',
    message: 'Modifying assigned student unit is permanently locked and rejected.'
  });
};

module.exports = {
  getAllStudents,
  toggleBlockStudent,
  updateStudentUnit,
  updateStudent
};
