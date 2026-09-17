const Progress = require('../model/Progress');
const Curriculum = require('../model/Curriculum');
const Assignment = require('../model/Assignment');
const User = require('../model/User');

const calculatePercentage = async (userId, unit) => {
  // 1. Materials calculation (50% weight)
  const curriculum = await Curriculum.findOne({ unit });
  let totalMaterials = 0;
  let completedMaterialsCount = 0;

  if (curriculum && curriculum.modules) {
    const allMaterialIds = [];
    curriculum.modules.forEach(module => {
      (module.materials || []).forEach(material => {
        allMaterialIds.push(material._id.toString());
      });
    });
    totalMaterials = allMaterialIds.length;

    if (totalMaterials > 0) {
      const progress = await Progress.findOne({ userId });
      if (progress && progress.completedMaterials) {
        completedMaterialsCount = progress.completedMaterials.filter(id => 
          allMaterialIds.includes(id.toString())
        ).length;
      }
    }
  }

  // 2. Assignments calculation (50% weight)
  const assignments = await Assignment.find({ unit });
  const totalAssignments = assignments.length;
  let submittedAssignmentsCount = 0;

  if (totalAssignments > 0) {
    submittedAssignmentsCount = assignments.filter(assignment =>
      (assignment.submissions || []).some(sub => sub.student && sub.student.toString() === userId.toString())
    ).length;
  }

  // 3. 50/50 Weighted Formula:
  // Progress = (Completed Materials / Total Materials * 50%) + (Submitted Assignments / Total Assignments * 50%)
  const materialsScore = totalMaterials > 0 ? (completedMaterialsCount / totalMaterials) * 50 : 0;
  const assignmentsScore = totalAssignments > 0 ? (submittedAssignmentsCount / totalAssignments) * 50 : 0;

  return Math.round(materialsScore + assignmentsScore);
};

const toggleMaterialStatus = async (req, res) => {
  try {
    const { materialId } = req.body;
    const userId = req.user.id;

    if (!materialId) {
      return res.status(400).json({ message: 'Material ID is required' });
    }

    let progress = await Progress.findOne({ userId });
    if (!progress) {
      progress = new Progress({ userId, completedMaterials: [] });
    }

    const index = progress.completedMaterials.indexOf(materialId);
    if (index > -1) {
      progress.completedMaterials.splice(index, 1);
    } else {
      progress.completedMaterials.push(materialId);
    }

    await progress.save();

    const percentage = await calculatePercentage(userId, req.user.unit);

    return res.status(200).json({
      status: 'success',
      data: {
        completedMaterials: progress.completedMaterials,
        percentage
      }
    });
  } catch (error) {
    console.error('Toggle material status error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await Progress.findOne({ userId });
    const completedMaterials = progress ? progress.completedMaterials : [];
    const percentage = await calculatePercentage(userId, req.user.unit);

    return res.status(200).json({
      status: 'success',
      data: {
        completedMaterials,
        percentage
      }
    });
  } catch (error) {
    console.error('Get my progress error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const progress = await Progress.findOne({ userId: studentId });
    const completedMaterials = progress ? progress.completedMaterials : [];
    const percentage = await calculatePercentage(studentId, student.unit);

    return res.status(200).json({
      status: 'success',
      data: {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          unit: student.unit,
          isBlocked: student.isBlocked
        },
        completedMaterials,
        percentage
      }
    });
  } catch (error) {
    console.error('Get student progress error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  calculatePercentage,
  toggleMaterialStatus,
  getMyProgress,
  getStudentProgress
};
