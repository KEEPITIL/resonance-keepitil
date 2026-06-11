const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/auth');
const { getOrganizerAnalytics, getEventAnalytics } = require('../controllers/analyticsController');

router.get('/organizer', protect, restrictTo('organizer', 'admin'), getOrganizerAnalytics);
router.get('/event/:eventId', protect, restrictTo('organizer', 'admin'), getEventAnalytics);

module.exports = router;
