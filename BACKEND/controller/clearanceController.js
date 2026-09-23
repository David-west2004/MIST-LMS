const User = require('../model/User');
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
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (student.isBlocked) {
      return res.status(403).json({ message: 'Access denied: Account suspended.' });
    }

    // 1. Evaluate Dynamic Clearance Policy Gate
    const eligibility = await checkClearanceEligibility(student._id);

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
          requirementDescription: 'Intern must log at least 3 geofenced check-ins at Alausa Secretariat for EVERY individual week of their tenure.'
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
          text: `Dear ${student.name},\n\nCongratulations on completing your SIWES Industrial Attachment at the Lagos State Ministry of Innovation, Science and Technology.\n\nPlease find attached your official Completion Certificate.\n\nVerification Serial: ${serialNumber}\n\nDirectorate of ICT, MIST Lagos State.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 8px;">
              <h2 style="color: #1A365D; margin-top: 0;">Official SIWES Completion Certificate</h2>
              <p style="color: #334155; line-height: 1.6;">Dear <strong>${student.name}</strong>,</p>
              <p style="color: #334155; line-height: 1.6;">
                Congratulations on successfully completing all curriculum milestones and attendance regulations for your SIWES Industrial Training in the <strong>${student.unit}</strong> unit at the <strong>Lagos State Ministry of Innovation, Science and Technology (MIST)</strong>.
              </p>
              <div style="background-color: #F8FAFC; border-left: 4px solid #008751; padding: 12px 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #64748B;">Verification Serial Number:</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; color: #1A365D; font-family: monospace;">${serialNumber}</p>
              </div>
              <p style="color: #334155; line-height: 1.6;">Your signed certificate is attached to this email as a high-resolution PDF document.</p>
              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94A3B8; text-align: center;">Lagos State Ministry of Innovation, Science and Technology • Alausa Secretariat, Ikeja</p>
            </div>
          `,
          attachments: [
            {
              filename: `MIST_SIWES_Completion_Certificate_${student.matricNumber || 'Intern'}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });

        emailSent = true;
        console.log(`Completion Certificate dispatched via email to ${student.email}`);
      } catch (mailErr) {
        console.error('Failed to send certificate email:', mailErr.message);
      }
    }

    // 4. Update Student State: Cleared for Completion
    student.isClearedForCompletion = true;
    await student.save();

    return res.status(200).json({
      status: 'success',
      message: 'Congratulations! Official MIST Completion Certificate generated and approved.',
      data: {
        serialNumber,
        isClearedForCompletion: true,
        emailSent,
        recipientEmail: student.email,
        pdfBase64: pdfBuffer.toString('base64'),
        fileName: `MIST_SIWES_Completion_Certificate_${student.matricNumber || 'Intern'}.pdf`
      }
    });
  } catch (error) {
    console.error('Request completion letter error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Returns current clearance eligibility status and whether student is already cleared.
 * GET /api/clearance/status
 */
const getClearanceStatus = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const eligibility = await checkClearanceEligibility(student._id);

    return res.status(200).json({
      status: 'success',
      data: {
        isClearedForCompletion: student.isClearedForCompletion || false,
        eligibility
      }
    });
  } catch (error) {
    console.error('Get clearance status error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  requestCompletionLetter,
  getClearanceStatus
};
