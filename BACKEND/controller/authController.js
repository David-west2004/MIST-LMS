const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const User = require('../model/User');
const Progress = require('../model/Progress');
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

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Access denied. Please, reach out to the system administrator.' });
    }

    const token = signToken(user._id);
    const now = new Date();
    await User.findByIdAndUpdate(user._id, { lastActive: now });
    user.lastActive = now;
    user.password = undefined;

    return res.status(200).json({
      status: 'success',
      token,
      data: { user }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const registerNewStudent = async (req, res) => {
  try {
    const { name, email, unit } = req.body;
    if (!name || !email || !unit) {
      return res.status(400).json({ message: 'Please provide name, email, and unit' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = Date.now() + 48 * 60 * 60 * 1000; // 48 hours

    const newStudent = await User.create({
      name,
      email,
      role: 'student',
      unit,
      inviteToken,
      tokenExpires
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/register?token=${inviteToken}`;

    console.log('\n==================================================');
    console.log(`INVITATION LOGGED FOR DEVELOPMENT:`);
    console.log(`Student: ${name} (${email})`);
    console.log(`Unit: ${unit}`);
    console.log(`Invite Link: ${inviteLink}`);
    console.log('==================================================\n');

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

        const mistLogoPath = path.join(__dirname, '../assets/MIST.webp');
        const attachments = fs.existsSync(mistLogoPath) ? [
          {
            filename: 'MIST.webp',
            path: mistLogoPath,
            cid: 'mistLogo' // referenced in HTML email template as cid:mistLogo
          }
        ] : [];

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MIST Student Portal" <no-reply@mist.gov.ng>',
          to: email,
          subject: 'Official Invitation // MIST Student IT Portal',
          html: generateInviteEmailHtml({ name, email, unit, inviteLink }),
          attachments
        });
        console.log(`Official branded invite email dispatched successfully to ${email}`);
      } catch (err) {
        console.error('Failed to send invite email:', err.message);
      }
    }

    return res.status(201).json({
      status: 'success',
      message: 'Student invited successfully.',
      data: {
        inviteToken,
        inviteLink
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
      inviteToken: token,
      tokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        name: user.name,
        email: user.email,
        unit: user.unit
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
      inviteToken: token,
      tokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    user.password = password;
    user.inviteToken = null;
    user.tokenExpires = null;
    await user.save();

    await Progress.findOneAndUpdate(
      { userId: user._id },
      { userId: user._id, completedMaterials: [] },
      { upsert: true, new: true }
    );

    const jwtToken = signToken(user._id);

    return res.status(200).json({
      status: 'success',
      message: 'Registration completed successfully.',
      token: jwtToken,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          unit: user.unit
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
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      status: 'success',
      data: { user }
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
      inviteToken: token,
      tokenExpires: { $gt: Date.now() }
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
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(req.user._id, { $set: { lastActive: null } });
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

