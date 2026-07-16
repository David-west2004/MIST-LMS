const express = require('express');
const router = express.Router();
const { login, inviteStudent, verifyInviteToken, completeRegistration, getMe } = require('../controller/authController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/login', login);
router.post('/invite', protect, restrictTo('admin'), inviteStudent);
router.get('/verify-invite/:token', verifyInviteToken);
router.post('/register-invited', completeRegistration);
router.get('/me', protect, getMe);

module.exports = router;
