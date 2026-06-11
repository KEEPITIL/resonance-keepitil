/**
 * External Event Controller — RESONANCE
 *
 * Admin-only CRUD for curated third-party events.
 * Public endpoints: GET list + click-through tracking.
 */

const ExternalEvent = require('../models/ExternalEvent');

// ─── GET /api/events/external ────────────────────────────────────────────────
// Public: list active external events with filters.
exports.getExternalEvents = async (req, res) => {
  try {
    const {
      genre, city, source, eventType, q,
      page = 1, limit = 30,
      lat, lng, radius = 100,     // geo filter (km) — used by Explore map
    } = req.query;

    const filter = { isActive: true, startDate: { $gte: new Date() } };

    if (genre)     filter.genres    = { $in: [genre] };
    if (city)      filter.city      = new RegExp(city, 'i');
    if (source)    filter.source    = source;
    if (eventType) filter.eventType = eventType;
    if (q)         filter.title     = new RegExp(q, 'i');

    // Geo radius filter (for map view)
    if (lat && lng) {
      const R = parseFloat(radius);
      // Simple bounding box approximation
      const latDelta = R / 111;
      const lngDelta = R / (111 * Math.cos(parseFloat(lat) * Math.PI / 180));
      filter.lat = { $gte: parseFloat(lat) - latDelta, $lte: parseFloat(lat) + latDelta };
      filter.lng = { $gte: parseFloat(lng) - lngDelta, $lte: parseFloat(lng) + lngDelta };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      ExternalEvent.find(filter)
        .select('-clickLog -adminNotes')
        .sort({ isFeatured: -1, startDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ExternalEvent.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: events,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/events/external/map ────────────────────────────────────────────
// Public: minimal payload for Explore map (only events with lat/lng).
exports.getExternalEventsForMap = async (req, res) => {
  try {
    const { genre, city, source } = req.query;
    const filter = {
      isActive: true,
      startDate: { $gte: new Date() },
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null },
    };
    if (genre)  filter.genres = { $in: [genre] };
    if (city)   filter.city   = new RegExp(city, 'i');
    if (source) filter.source = source;

    const events = await ExternalEvent.find(filter)
      .select('title artist startDate venueName city genres source lat lng posterImage externalTicketLink priceDisplay clickThroughs')
      .sort({ isFeatured: -1, startDate: 1 })
      .limit(200);

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/events/external/:id ───────────────────────────────────────────
// Public: single external event detail.
exports.getExternalEventById = async (req, res) => {
  try {
    const event = await ExternalEvent.findOne({ _id: req.params.id, isActive: true })
      .select('-clickLog -adminNotes')
      .populate('addedBy', 'firstName');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/events/external/:id/click ────────────────────────────────────
// Public: track redirect click to external platform.
exports.trackClick = async (req, res) => {
  try {
    const event = await ExternalEvent.findById(req.params.id).select('externalTicketLink clickThroughs');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Fire-and-forget analytics update
    ExternalEvent.updateOne(
      { _id: event._id },
      {
        $inc: { clickThroughs: 1 },
        $push: {
          clickLog: {
            clickedAt: new Date(),
            userAgent: req.get('User-Agent')?.slice(0, 200),
            user: req.user?._id,
          },
        },
      }
    ).catch(() => {});

    res.json({
      success: true,
      redirectUrl: event.externalTicketLink,
      clickThroughs: event.clickThroughs + 1,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Create ─────────────────────────────────────────────────────────────
exports.createExternalEvent = async (req, res) => {
  try {
    const event = await ExternalEvent.create({ ...req.body, addedBy: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Admin: Update ─────────────────────────────────────────────────────────────
exports.updateExternalEvent = async (req, res) => {
  try {
    const event = await ExternalEvent.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Admin: Delete ─────────────────────────────────────────────────────────────
exports.deleteExternalEvent = async (req, res) => {
  try {
    const event = await ExternalEvent.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: Analytics ──────────────────────────────────────────────────────────
// GET /api/admin/external-events/analytics
exports.getClickAnalytics = async (req, res) => {
  try {
    const stats = await ExternalEvent.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$source',
          totalEvents:      { $sum: 1 },
          totalClickThroughs: { $sum: '$clickThroughs' },
          avgClicksPerEvent:  { $avg: '$clickThroughs' },
        },
      },
      { $sort: { totalClickThroughs: -1 } },
    ]);

    const topEvents = await ExternalEvent.find({ isActive: true })
      .select('title source clickThroughs startDate city')
      .sort({ clickThroughs: -1 })
      .limit(10);

    res.json({
      success: true,
      data: { bySource: stats, topEvents },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
