const { User } = require('../models');
const { checkClearanceEligibility } = require('./attendanceController');
const { generateCompletionCertificate } = require('../utils/certificateGenerator');
const nodemailer = require('nodemailer');

/**
 * Validates clearance gate, generates official completion certificate PDF,
 * dispatches it to student's email, and marks student as cleared.
 * POST /api/clearance/request-letter
 */
const requestCompletionLetter = async (req, res) => {
  try {
    const student = await User.findByPk(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.isBlocked) {
      return res.status(403).json({ message: 'Access denied: Account suspended.' });
    }

    // 1. Evaluate Dynamic Clearance Policy Gate
    const eligibility = await checkClearanceEligibility(student.id);

    if (!eligibility.eligible) {
      return res.status(403).json({
        status: 'fail',
        message: 'Ineligible for SIWES completion certificate: Minimum attendance requirements not satisfied.',
        data: {
          eligible: false,
          totalDays: eligibility.totalDays,
          targetDays: eligibility.targetDays,
          compliantWeeks: eligibility.compliantWeeks,
          targetWeeks: eligibility.targetWeeks,
          missingWeeks: eligibility.missingWeeks,
          weeklyBreakdown: eligibility.weeklyBreakdown,
          requirementDescription: 'Intern must log at least 3 check-ins for EVERY individual week of their tenure.'
        }
      });
    }

    // 2. Generate Official MIST Completion Certificate PDF
    const { pdfBuffer, serialNumber } = await generateCompletionCertificate({
      name: student.name,
      institution: student.institution,
      matricNumber: student.matricNumber,
      unit: student.unit,
      siwesDuration: student.siwesDuration || '6_months',
      siwesDurationWeeks: student.siwesDurationWeeks || 24,
      siwesStartDate: student.siwesStartDate,
      siwesEndDate: student.siwesEndDate
    });

    // 3. Dispatch PDF via Nodemailer
    let emailSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MIST Student Portal" <no-reply@mist.gov.ng>',
          to: student.email,
          subject: 'Official SIWES Completion Certificate // Lagos State MIST',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
              <h2 style="color: #0f172a;">Congratulations, ${student.name}!</h2>
              <p>We are pleased to inform you that you have satisfied all attendance and SIWES curriculum requirements at the <strong>Lagos State Ministry of Innovation, Science and Technology (MIST)</strong>.</p>
              <p>Your official SIWES Completion Certificate (Serial: <strong>${serialNumber}</strong>) is attached to this email.</p>
              <br/>
              <p>Best regards,<br/><strong>MIST Student IT Administration</strong></p>
            </div>
          `,
          attachments: [
            {
              filename: `MIST_SIWES_Completion_Certificate_${serialNumber}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });
        emailSent = true;
      } catch (err) {
        console.error('Failed to dispatch certificate email:', err.message);
      }
    }

    // 4. Mark student as cleared
    student.isClearedForCompletion = true;
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: emailSent
        ? 'Certificate generated and emailed successfully.'
        : 'Certificate generated successfully.',
      data: {
        serialNumber,
        isClearedForCompletion: true,
        emailSent,
        pdfBase64: pdfBuffer.toString('base64')
      }
    });
  } catch (error) {
    console.error('Request completion letter error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Returns student's clearance status and eligibility metrics.
 * GET /api/clearance/status (for student) or GET /api/clearance/status/:studentId (for supervisor)
 */
const getClearanceStatus = async (req, res) => {
  try {
    const targetId = (req.user.role === 'supervisor' && req.params.studentId)
      ? req.params.studentId
      : req.user.id;

    const student = await User.findByPk(targetId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const eligibility = await checkClearanceEligibility(student.id);

    return res.status(200).json({
      status: 'success',
      data: {
        isClearedForCompletion: student.isClearedForCompletion,
        eligibility
      }
    });
  } catch (error) {
    console.error('Get clearance status error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Supervisor clearance approval
 * POST /api/clearance/approve/:studentId
 */
const approveClearance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isClearedForCompletion = true;
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: `Student ${student.name} has been officially cleared by supervisor.`,
      data: {
        studentId: student.id,
        isClearedForCompletion: student.isClearedForCompletion
      }
    });
  } catch (error) {
    console.error('Approve clearance error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  requestCompletionLetter,
  getClearanceStatus,
  approveClearance
};
