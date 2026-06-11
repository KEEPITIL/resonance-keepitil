const router = require('express').Router();
const { protect } = require('../middleware/auth');
const {
  register, login, getMe,
  forgotPassword, resetPassword, updatePassword,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.patch('/update-password', protect, updatePassword);

module.exports = router;
