const { Assignment, Submission, User } = require('../models');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Format assignment object to ensure compatibility with frontend fields:
 * maps dueDate <-> deadline and moduleTag <-> module
 */
const formatAssignment = (assignment, studentId = null) => {
  const json = assignment.toJSON ? assignment.toJSON() : assignment;
  json.module = json.moduleTag || json.module;
  json.deadline = json.dueDate || json.deadline;

  if (studentId && Array.isArray(json.submissions)) {
    const mySub = json.submissions.find(s => String(s.studentId) === String(studentId));
    json.mySubmission = mySub || null;
    json.isSubmitted = !!mySub;
  }
  return json;
};

const getAssignmentsByUnit = async (req, res) => {
  try {
    const { unit } = req.params;
    const studentId = req.user ? req.user.id : null;

    const assignments = await Assignment.findAll({
      where: { unit },
      include: [
        {
          model: Submission,
          as: 'submissions'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const enhanced = assignments.map(a => formatAssignment(a, studentId));

    return res.status(200).json({
      status: 'success',
      results: enhanced.length,
      data: { assignments: enhanced }
    });
  } catch (error) {
    console.error('Get assignments error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const unit = req.user.unit;
    const studentId = req.user.id;

    const assignments = await Assignment.findAll({
      where: { unit },
      include: [
        {
          model: Submission,
          as: 'submissions'
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    const enhanced = assignments.map(a => formatAssignment(a, studentId));

    return res.status(200).json({
      status: 'success',
      results: enhanced.length,
      data: { assignments: enhanced }
    });
  } catch (error) {
    console.error('Get my assignments error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { unit, module, moduleTag, title, description, deadline, dueDate } = req.body;
    const finalModule = moduleTag || module;
    const finalDueDate = dueDate || deadline;

    if (!unit || !finalModule || !title || !description || !finalDueDate) {
      return res.status(400).json({
        message: 'Unit, module, title, description, and deadline are required'
      });
    }

    const assignment = await Assignment.create({
      unit,
      moduleTag: finalModule,
      title,
      description,
      dueDate: new Date(finalDueDate)
    });

    const formatted = formatAssignment(assignment);

    return res.status(201).json({
      status: 'success',
      data: { assignment: formatted }
    });
  } catch (error) {
    console.error('Create assignment error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await assignment.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        message: 'Please upload a completed assignment file (.pdf, .doc, .docx, or .mp4)'
      });
    }

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Stream directly to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(
      req.file.buffer,
      'mist_lms/assignments',
      { resource_type: 'auto' }
    );

    let submission = await Submission.findOne({
      where: {
        assignmentId: id,
        studentId
      }
    });

    const now = new Date();
    if (submission) {
      submission.submissionUrl = cloudinaryResult.secure_url;
      submission.publicId = cloudinaryResult.public_id;
      submission.submittedAt = now;
      await submission.save();
    } else {
      submission = await Submission.create({
        assignmentId: id,
        studentId,
        submissionUrl: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        submittedAt: now
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Assignment submitted successfully to Cloudinary',
      data: {
        submissionUrl: submission.submissionUrl,
        fileUrl: submission.submissionUrl,
        publicId: submission.publicId,
        submittedAt: submission.submittedAt
      }
    });
  } catch (error) {
    console.error('Submit assignment error:', error.message);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getAllAdminAssignments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.unit) {
      filter.unit = req.query.unit;
    }

    const assignments = await Assignment.findAll({
      where: filter,
      include: [
        {
          model: Submission,
          as: 'submissions',
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['id', 'name', 'email', 'unit']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const enhanced = assignments.map(a => formatAssignment(a));

    return res.status(200).json({
      status: 'success',
      results: enhanced.length,
      data: { assignments: enhanced }
    });
  } catch (error) {
    console.error('Get all admin assignments error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (grade !== undefined) submission.grade = grade;
    if (feedback !== undefined) submission.feedback = feedback;
    await submission.save();

    return res.status(200).json({
      status: 'success',
      message: 'Submission graded successfully',
      data: { submission }
    });
  } catch (error) {
    console.error('Grade submission error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllAdminAssignments,
  getAssignmentsByUnit,
  getMyAssignments,
  createAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission
};
