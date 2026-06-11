/**
 * External Events Routes — RESONANCE
 *
 * Public:  GET /api/events/external         — list with filters
 *          GET /api/events/external/map      — minimal map payload (lat/lng only)
 *          GET /api/events/external/:id      — single event
 *          POST /api/events/external/:id/click — track redirect click
 *
 * Admin:   POST   /api/events/external       — create
 *          PATCH  /api/events/external/:id   — update
 *          DELETE /api/events/external/:id   — delete
 *          GET    /api/admin/external-events/analytics — click stats
 */

const router = require('express').Router();
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const {
  getExternalEvents,
  getExternalEventsForMap,
  getExternalEventById,
  trackClick,
  createExternalEvent,
  updateExternalEvent,
  deleteExternalEvent,
  getClickAnalytics,
} = require('../controllers/externalEventController');

// ── Public ──────────────────────────────────────────────────────────────────
router.get('/',           getExternalEvents);
router.get('/map',        getExternalEventsForMap);
router.get('/:id',        getExternalEventById);
router.post('/:id/click', optionalAuth, trackClick);

// ── Admin ────────────────────────────────────────────────────────────────────
router.post(  '/',    protect, restrictTo('admin'), createExternalEvent);
router.patch( '/:id', protect, restrictTo('admin'), updateExternalEvent);
router.delete('/:id', protect, restrictTo('admin'), deleteExternalEvent);

module.exports = router;
