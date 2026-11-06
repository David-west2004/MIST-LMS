const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { User, Attendance, Progress } = require('../models');
const { normalizeToUTCDate, checkClearanceEligibility } = require('./attendanceController');
const nodemailer = require('nodemailer');
const { generateInviteEmailHtml } = require('../utils/emailTemplate');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyformiststudentitportal2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Access denied. Please, reach out to the system administrator.' });
    }

    const token = signToken(user.id);
    const now = new Date();
    user.lastActive = now;
    await user.save();

    let attendanceSummary = null;
    if (user.role === 'student') {
      try {
        const today = normalizeToUTCDate(now);
        const durationWeeks = user.siwesDurationWeeks || 24;
        let weekNumber = 1;
        if (user.siwesStartDate) {
          const diffMs = now.getTime() - new Date(user.siwesStartDate).getTime();
          weekNumber = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
          if (weekNumber < 1) weekNumber = 1;
          if (weekNumber > durationWeeks) weekNumber = durationWeeks;
        }

        const existingRecord = await Attendance.findOne({
          where: {
            userId: user.id,
            date: today
          }
        });

        let isNewCheckIn = false;
        if (!existingRecord) {
          try {
            await Attendance.create({
              userId: user.id,
              date: today,
              weekNumber,
              status: 'present'
            });
            isNewCheckIn = true;
          } catch (attErr) {
            console.error('Auto attendance creation error:', attErr.message);
          }
        }

        const eligibility = await checkClearanceEligibility(user.id);

        attendanceSummary = {
          checkedInToday: true,
          isNewCheckIn,
          date: today,
          weekNumber,
          eligibility
        };
      } catch (attSummaryErr) {
        console.error('Login auto-attendance processing error:', attSummaryErr.message);
      }
    }

    const userObj = user.toJSON ? user.toJSON() : { ...user };
    delete userObj.password;

    return res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          ...userObj,
          _id: user.id
        },
        attendanceSummary
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const registerNewStudent = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      unit, 
      siwesDuration, 
      siwesStartDate, 
      institution, 
      matricNumber, 
      phoneNumber 
    } = req.body;

    if (!name || !email || !unit) {
      return res.status(400).json({ message: 'Name, email, and unit are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'A student or account with this email address already exists.' });
    }

    const durationKey = ['3_months', '6_months', '1_year'].includes(siwesDuration) 
      ? siwesDuration 
      : '6_months';

    let siwesDurationWeeks = 24;
    if (durationKey === '3_months') siwesDurationWeeks = 12;
    if (durationKey === '1_year') siwesDurationWeeks = 52;

    const startDate = siwesStartDate ? new Date(siwesStartDate) : new Date();
    const siwesEndDate = new Date(startDate.getTime() + (siwesDurationWeeks * 7 * 24 * 60 * 60 * 1000));

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const newStudent = await User.create({
      name,
      email,
      role: 'student',
      unit,
      siwesDuration: durationKey,
      siwesDurationWeeks,
      siwesStartDate: startDate,
      siwesEndDate,
      institution: institution ? institution.trim() : null,
      matricNumber: matricNumber ? matricNumber.trim() : null,
      phoneNumber: phoneNumber ? phoneNumber.trim() : null,
      isClearedForCompletion: false,
      inviteToken,
      tokenExpires
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/register?token=${inviteToken}`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT, 10) || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const mistLogoPath = path.join(__dirname, '../assets/MIST.webp');
        const attachments = fs.existsSync(mistLogoPath) ? [
          {
            filename: 'MIST.webp',
            path: mistLogoPath,
            cid: 'mistLogo'
          }
        ] : [];

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MIST Student Portal" <no-reply@mist.gov.ng>',
          to: email,
          subject: 'Official Invitation // MIST Student IT Portal',
          html: generateInviteEmailHtml({ 
            name, 
            email, 
            unit, 
            inviteLink,
            siwesDuration: durationKey,
            siwesDurationWeeks,
            siwesStartDate: startDate,
            siwesEndDate,
            institution,
            matricNumber
          }),
          attachments
        });
      } catch (err) {
        console.error('Failed to send invite email:', err.message);
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Student invited successfully.',
      data: {
        inviteToken,
        inviteLink,
        student: {
          id: newStudent.id,
          _id: newStudent.id,
          name: newStudent.name,
          email: newStudent.email,
          unit: newStudent.unit,
          siwesDuration: newStudent.siwesDuration,
          siwesDurationWeeks: newStudent.siwesDurationWeeks,
          siwesStartDate: newStudent.siwesStartDate,
          siwesEndDate: newStudent.siwesEndDate,
          institution: newStudent.institution,
          matricNumber: newStudent.matricNumber,
          phoneNumber: newStudent.phoneNumber
        }
      }
    });
  } catch (error) {
    console.error('Invite student error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const verifyInviteToken = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      where: {
        inviteToken: token,
        tokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        _id: user.id,
        name: user.name,
        email: user.email,
        unit: user.unit,
        siwesDuration: user.siwesDuration,
        siwesDurationWeeks: user.siwesDurationWeeks,
        siwesStartDate: user.siwesStartDate,
        siwesEndDate: user.siwesEndDate,
        institution: user.institution,
        matricNumber: user.matricNumber,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Verify token error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const validatePasswordComplexity = (password) => {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[@$!%*?&#^()_+\-=[\]{}|;:,.<>]/.test(password)) return false;
  return true;
};

const completeRegistration = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (!validatePasswordComplexity(password)) {
      return res.status(400).json({
        message: 'Password does not meet complexity requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special symbol (@$!%*?&#^()_+-=[]{}|;:,.<>).'
      });
    }

    const user = await User.findOne({
      where: {
        inviteToken: token,
        tokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    user.password = password;
    user.inviteToken = null;
    user.tokenExpires = null;
    await user.save();

    const jwtToken = signToken(user.id);

    return res.status(200).json({
      status: 'success',
      message: 'Registration completed successfully.',
      token: jwtToken,
      data: {
        user: {
          id: user.id,
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          unit: user.unit,
          siwesDuration: user.siwesDuration,
          siwesDurationWeeks: user.siwesDurationWeeks,
          siwesStartDate: user.siwesStartDate,
          siwesEndDate: user.siwesEndDate,
          institution: user.institution,
          matricNumber: user.matricNumber,
          phoneNumber: user.phoneNumber,
          isClearedForCompletion: user.isClearedForCompletion
        }
      }
    });
  } catch (error) {
    console.error('Complete registration error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userJson = user.toJSON ? user.toJSON() : { ...user };
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          ...userJson,
          _id: user.id
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (!validatePasswordComplexity(newPassword)) {
      return res.status(400).json({
        message: 'Password does not meet complexity requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special symbol (@$!%*?&#^()_+-=[]{}|;:,.<>).'
      });
    }

    const user = await User.findOne({
      where: {
        inviteToken: token,
        tokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    user.password = newPassword;
    user.inviteToken = null;
    user.tokenExpires = null;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Password reset successfully.'
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user && req.user.id) {
      await User.update({ lastActive: null }, { where: { id: req.user.id } });
    }
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  login,
  registerNewStudent,
  verifyInviteToken,
  completeRegistration,
  resetPassword,
  logout,
  getMe
};
