const express = require('express');
const router = express.Router();
const { login, registerNewStudent, verifyInviteToken, completeRegistration, resetPassword, logout, getMe } = require('../controller/authController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/login', login);
router.post('/invite', protect, restrictTo('admin'), registerNewStudent);
router.get('/verify-invite/:token', verifyInviteToken);
router.post('/register-invited', completeRegistration);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
