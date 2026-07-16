const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Progress = require('../model/Progress');
const nodemailer = require('nodemailer');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkeyformiststudentitportal2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
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
      return res.status(403).json({ message: 'Access denied. Account has been suspended.' });
    }

    const token = signToken(user._id);
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

const inviteStudent = async (req, res) => {
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

        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'no-reply@mist.gov.ng',
          to: email,
          subject: 'MIST Student IT Portal Invitation',
          html: `<p>Hello ${name},</p>
                 <p>You have been invited to register for the MIST Student IT Portal as a student in the <strong>${unit}</strong> unit.</p>
                 <p>Please click the link below to set your password and complete your registration (valid for 48 hours):</p>
                 <p><a href="${inviteLink}">${inviteLink}</a></p>`
        });
        console.log(`Email sent successfully to ${email}`);
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

const completeRegistration = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
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

module.exports = {
  login,
  inviteStudent,
  verifyInviteToken,
  completeRegistration,
  getMe
};
