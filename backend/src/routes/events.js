const router = require('express').Router();
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const {
  getEvents, getEventBySlug, createEvent, updateEvent,
  publishEvent, deleteEvent, getMyEvents, getEventsForMap,
} = require('../controllers/eventController');
const { eventCoverUpload, galleryUpload } = require('../services/s3Service');
const {
  joinWaitlist, leaveWaitlist, getWaitlist, notifyWaitlist,
} = require('../controllers/waitlistController');
const {
  generateCode, listCodes, updateKickbackSettings, getMyEarnings,
} = require('../controllers/kickbackController');

router.get('/', optionalAuth, getEvents);
router.get('/map', getEventsForMap);
router.get('/my', protect, restrictTo('organizer', 'admin'), getMyEvents);
// Must be before /:slug to avoid param collision
router.get('/kickback/earnings', protect, getMyEarnings);
router.get('/:slug', optionalAuth, getEventBySlug);

router.post('/', protect, restrictTo('organizer', 'admin'), createEvent);
router.patch('/:id', protect, restrictTo('organizer', 'admin'), updateEvent);
router.patch('/:id/publish', protect, restrictTo('organizer', 'admin'), publishEvent);
router.delete('/:id', protect, restrictTo('organizer', 'admin'), deleteEvent);

// ── Waitlist routes ──────────────────────────────────────────────────────────
router.post(  '/:id/waitlist',         optionalAuth, joinWaitlist);
router.delete('/:id/waitlist',         protect, leaveWaitlist);
router.get(   '/:id/waitlist',         protect, restrictTo('organizer', 'admin'), getWaitlist);
router.post(  '/:id/waitlist/notify',  protect, restrictTo('organizer', 'admin'), notifyWaitlist);

// ── Kickback / referral routes ───────────────────────────────────────────────
router.post('/:id/kickback/codes',  protect, generateCode);
router.get( '/:id/kickback/codes',  protect, restrictTo('organizer', 'admin'), listCodes);
router.put( '/:id/kickback',        protect, restrictTo('organizer', 'admin'), updateKickbackSettings);

// Cover image upload
router.post('/:id/cover', protect, restrictTo('organizer', 'admin'),
  eventCoverUpload.single('cover'), async (req, res, next) => {
    try {
      const Event = require('../models/Event');
      const event = await Event.findOneAndUpdate(
        { _id: req.params.id, organizer: req.user._id },
        { coverImage: req.file.location },
        { new: true }
      );
      res.json({ success: true, url: req.file.location, data: event });
    } catch (err) { next(err); }
  });

module.exports = router;
