const { Progress, Material, Assignment, Submission, User } = require('../models');

const calculatePercentage = async (userId, unit) => {
  // 1. Materials calculation (50% weight)
  const totalMaterials = await Material.count({ where: { unit } });
  let completedMaterialsCount = 0;

  if (totalMaterials > 0) {
    const materials = await Material.findAll({ where: { unit }, attributes: ['id'] });
    const materialIds = materials.map(m => m.id);

    completedMaterialsCount = await Progress.count({
      where: {
        userId,
        materialId: materialIds,
        isCompleted: true
      }
    });
  }

  // 2. Assignments calculation (50% weight)
  const assignments = await Assignment.findAll({ where: { unit }, attributes: ['id'] });
  const totalAssignments = assignments.length;
  let submittedAssignmentsCount = 0;

  if (totalAssignments > 0) {
    const assignmentIds = assignments.map(a => a.id);
    submittedAssignmentsCount = await Submission.count({
      where: {
        studentId: userId,
        assignmentId: assignmentIds
      }
    });
  }

  // 3. 50/50 Weighted Formula
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

    let progress = await Progress.findOne({
      where: { userId, materialId }
    });

    if (progress) {
      progress.isCompleted = !progress.isCompleted;
      await progress.save();
    } else {
      progress = await Progress.create({
        userId,
        materialId,
        isCompleted: true
      });
    }

    const allCompleted = await Progress.findAll({
      where: { userId, isCompleted: true },
      attributes: ['materialId']
    });

    const completedMaterialIds = allCompleted.map(p => p.materialId);
    const percentage = await calculatePercentage(userId, req.user.unit);

    return res.status(200).json({
      status: 'success',
      data: {
        completedMaterials: completedMaterialIds,
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
    const unit = req.user.unit;

    const allCompleted = await Progress.findAll({
      where: { userId, isCompleted: true },
      attributes: ['materialId']
    });

    const completedMaterialIds = allCompleted.map(p => p.materialId);
    const percentage = await calculatePercentage(userId, unit);

    return res.status(200).json({
      status: 'success',
      data: {
        completedMaterials: completedMaterialIds,
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
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const allCompleted = await Progress.findAll({
      where: { userId: studentId, isCompleted: true },
      attributes: ['materialId']
    });

    const completedMaterialIds = allCompleted.map(p => p.materialId);
    const percentage = await calculatePercentage(studentId, student.unit);

    return res.status(200).json({
      status: 'success',
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          unit: student.unit
        },
        completedMaterials: completedMaterialIds,
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
