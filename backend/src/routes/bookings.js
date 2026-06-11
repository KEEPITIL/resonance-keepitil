const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/auth');
const { createBooking, respondToBooking, getMyBookings, getDJBookings, sendMessage } = require('../controllers/bookingController');

router.post('/', protect, restrictTo('organizer', 'admin'), createBooking);
router.get('/my', protect, restrictTo('organizer', 'admin'), getMyBookings);
router.get('/dj', protect, restrictTo('dj'), getDJBookings);
router.patch('/:ref/respond', protect, restrictTo('dj'), respondToBooking);
router.post('/:ref/message', protect, sendMessage);

module.exports = router;
