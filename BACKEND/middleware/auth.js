const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyformiststudentitportal2026');

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Access denied. Account has been suspended.' });
    }

    const isLogout = req.originalUrl && req.originalUrl.includes('/logout');
    if (!isLogout) {
      const now = new Date();
      user.lastActive = now;
      user.save().catch(err => {
        console.error('Failed to update user lastActive:', err.message);
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authorization middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};

const supervisorOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'supervisor') {
    return res.status(403).json({ message: 'Forbidden. Supervisor access required.' });
  }
  next();
};

module.exports = {
  protect,
  restrictTo,
  supervisorOnly
};
