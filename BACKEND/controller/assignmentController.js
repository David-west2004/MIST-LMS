const Assignment = require('../model/Assignment');

const getAssignmentsByUnit = async (req, res) => {
  try {
    const { unit } = req.params;
    const assignments = await Assignment.find({ unit }).sort({ createdAt: -1 });

    // Enhance each assignment with submission status for student
    const studentId = req.user ? req.user.id : null;
    const enhanced = assignments.map(a => {
      const obj = a.toObject();
      if (studentId) {
        const mySubmission = obj.submissions.find(s => s.student.toString() === studentId.toString());
        obj.mySubmission = mySubmission || null;
        obj.isSubmitted = !!mySubmission;
      }
      return obj;
    });

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
    const assignments = await Assignment.find({ unit }).sort({ deadline: 1 });
    const studentId = req.user.id;

    const enhanced = assignments.map(a => {
      const obj = a.toObject();
      const mySubmission = obj.submissions.find(s => s.student.toString() === studentId.toString());
      obj.mySubmission = mySubmission || null;
      obj.isSubmitted = !!mySubmission;
      return obj;
    });

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
    const { unit, module, title, description, deadline } = req.body;
    if (!unit || !module || !title || !description || !deadline) {
      return res.status(400).json({ message: 'Unit, module, title, description, and deadline are required' });
    }

    const assignment = await Assignment.create({
      unit,
      module,
      title,
      description,
      deadline: new Date(deadline),
      submissions: []
    });

    return res.status(201).json({
      status: 'success',
      data: { assignment }
    });
  } catch (error) {
    console.error('Create assignment error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
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

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a completed assignment file (.pdf, .doc, .docx, or .mp4)' });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const fileUrl = `/uploads/assignments/${req.file.filename}`;

    const existingSubIndex = assignment.submissions.findIndex(
      s => s.student.toString() === studentId.toString()
    );

    if (existingSubIndex > -1) {
      assignment.submissions[existingSubIndex].fileUrl = fileUrl;
      assignment.submissions[existingSubIndex].submittedAt = new Date();
    } else {
      assignment.submissions.push({
        student: studentId,
        fileUrl,
        submittedAt: new Date()
      });
    }

    await assignment.save();

    return res.status(200).json({
      status: 'success',
      message: 'Assignment submitted successfully',
      data: {
        fileUrl,
        submittedAt: new Date()
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
    const assignments = await Assignment.find(filter)
      .populate('submissions.student', 'name email unit')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      results: assignments.length,
      data: { assignments }
    });
  } catch (error) {
    console.error('Get all admin assignments error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAllAdminAssignments,
  getAssignmentsByUnit,
  getMyAssignments,
  createAssignment,
  deleteAssignment,
  submitAssignment
};
