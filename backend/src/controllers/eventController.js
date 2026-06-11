const Event = require('../models/Event');
const slugify = require('slugify');

// GET /api/events
exports.getEvents = async (req, res, next) => {
  try {
    const {
      genre, city, eventType, startDate, endDate,
      minPrice, maxPrice, isFree, featured,
      q, page = 1, limit = 20,
    } = req.query;

    const filter = { status: 'published' };

    if (genre) filter.genres = genre;
    if (city) filter['venue.city'] = new RegExp(city, 'i');
    if (eventType) filter.eventType = eventType;
    if (isFree === 'true') filter.isFree = true;
    if (featured === 'true') filter.isFeatured = true;

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    } else {
      // Default: upcoming events only
      filter.startDate = { $gte: new Date() };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.minPrice = {};
      if (minPrice) filter.minPrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.maxPrice = { $lte: parseFloat(maxPrice) };
    }

    if (q) {
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { 'venue.name': new RegExp(q, 'i') },
        { tags: new RegExp(q, 'i') },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organizer', 'firstName lastName username')
        .sort({ isFeatured: -1, startDate: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: events,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { next(err); }
};

// GET /api/events/:slug
exports.getEventBySlug = async (req, res, next) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug })
      .populate('organizer', 'firstName lastName username avatar')
      .populate('lineup.dj', 'stageName slug profilePhoto genres');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    event.viewCount += 1;
    await event.save({ validateBeforeSave: false });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

// POST /api/events
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, shortDescription, startDate, endDate, doorsOpen,
      venue, genres, eventType, lineup, ticketTiers, isFree, tags } = req.body;

    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = `${baseSlug}-${Date.now()}`;

    const event = await Event.create({
      organizer: req.user._id,
      title, description, shortDescription,
      startDate, endDate, doorsOpen,
      venue, genres, eventType, lineup,
      ticketTiers: isFree ? [{ name: 'Free Entry', price: 0, quantity: venue?.capacity || 500 }] : ticketTiers,
      isFree: !!isFree,
      tags, slug,
      status: 'draft',
    });

    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
};

// PATCH /api/events/:id
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });

    const allowed = [
      'title', 'description', 'shortDescription', 'startDate', 'endDate', 'doorsOpen',
      'venue', 'genres', 'eventType', 'lineup', 'ticketTiers', 'isFree',
      'coverImage', 'galleryImages', 'promoVideoUrl', 'tags', 'status',
    ];
    allowed.forEach((key) => { if (req.body[key] !== undefined) event[key] = req.body[key]; });

    if (req.body.title && req.body.title !== event.title) {
      event.slug = `${slugify(req.body.title, { lower: true, strict: true })}-${Date.now()}`;
    }

    await event.save();
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

// PATCH /api/events/:id/publish
exports.publishEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Not found' });
    if (!event.coverImage) return res.status(400).json({ success: false, message: 'Add a cover image before publishing' });
    event.status = 'published';
    await event.save();
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, organizer: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Not found' });
    // Soft cancel instead of hard delete if tickets were sold
    if (event.totalTicketsSold > 0) {
      event.status = 'cancelled';
      await event.save();
    } else {
      await event.deleteOne();
    }
    res.json({ success: true, message: 'Event removed' });
  } catch (err) { next(err); }
};

// GET /api/events/organizer/my
exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ startDate: -1 }).lean();
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

// GET /api/events/map — all upcoming events with coordinates
exports.getEventsForMap = async (req, res, next) => {
  try {
    const events = await Event.find({
      status: 'published',
      startDate: { $gte: new Date() },
      'venue.lat': { $exists: true },
      'venue.lng': { $exists: true },
    })
      .select('title slug startDate venue coverImage genres ticketTiers isFree minPrice')
      .lean();
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};
