/**
 * Admin Routes — RESONANCE
 * All routes require admin role.
 */

const router = require('express').Router();
const { protect, restrictTo } = require('../middleware/auth');
const { getClickAnalytics } = require('../controllers/externalEventController');

// Restrict all admin routes
router.use(protect, restrictTo('admin'));

// External event click-through analytics
router.get('/external-events/analytics', getClickAnalytics);

module.exports = router;
