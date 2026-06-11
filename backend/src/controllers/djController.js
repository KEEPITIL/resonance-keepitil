const DJProfile = require('../models/DJProfile');
const slugify = require('slugify');

// GET /api/djs — list/search DJs
exports.getDJs = async (req, res, next) => {
  try {
    const { genre, city, q, featured, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true };

    if (genre) filter.genres = genre;
    if (city) filter.homeCity = new RegExp(city, 'i');
    if (featured === 'true') filter.isFeatured = true;
    if (q) filter.$or = [
      { stageName: new RegExp(q, 'i') },
      { bio: new RegExp(q, 'i') },
      { genres: new RegExp(q, 'i') },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [djs, total] = await Promise.all([
      DJProfile.find(filter)
        .populate('user', 'firstName lastName email avatar')
        .sort({ isFeatured: -1, rating: -1, totalBookings: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DJProfile.countDocuments(filter),
    ]);

    res.json({ success: true, data: djs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

// GET /api/djs/:slug
exports.getDJBySlug = async (req, res, next) => {
  try {
    const dj = await DJProfile.findOne({ slug: req.params.slug })
      .populate('user', 'firstName lastName email avatar username');
    if (!dj) return res.status(404).json({ success: false, message: 'DJ not found' });

    // Increment view count
    dj.profileViews += 1;
    await dj.save({ validateBeforeSave: false });

    res.json({ success: true, data: dj });
  } catch (err) { next(err); }
};

// GET /api/djs/me — my own profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const dj = await DJProfile.findOne({ user: req.user._id });
    if (!dj) return res.status(404).json({ success: false, message: 'DJ profile not found. Create one first.' });
    res.json({ success: true, data: dj });
  } catch (err) { next(err); }
};

// POST /api/djs — create DJ profile
exports.createDJProfile = async (req, res, next) => {
  try {
    const existing = await DJProfile.findOne({ user: req.user._id });
    if (existing) return res.status(409).json({ success: false, message: 'DJ profile already exists' });

    const { stageName, genres, bio, shortBio, homeCity, theme, socialLinks, bookingEnabled, minBookingFee } = req.body;

    const baseSlug = slugify(stageName, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await DJProfile.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const dj = await DJProfile.create({
      user: req.user._id,
      stageName, genres, bio, shortBio, homeCity,
      slug,
      theme: theme || {},
      socialLinks: socialLinks || {},
      bookingEnabled,
      minBookingFee,
      isPublished: false,
    });

    res.status(201).json({ success: true, data: dj });
  } catch (err) { next(err); }
};

// PATCH /api/djs/me — update DJ profile
exports.updateDJProfile = async (req, res, next) => {
  try {
    const allowed = [
      'stageName', 'genres', 'bio', 'shortBio', 'homeCity', 'willingToTravel',
      'travelRadius', 'theme', 'socialLinks', 'widgets', 'bookingEnabled',
      'bookingEmail', 'minBookingFee', 'maxBookingFee', 'bookingNotes',
      'isPublished', 'profilePhoto', 'bannerImage', 'logoImage', 'galleryImages',
    ];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    // Re-slug if stageName changed
    if (updates.stageName) {
      const baseSlug = slugify(updates.stageName, { lower: true, strict: true });
      let slug = baseSlug; let counter = 1;
      const current = await DJProfile.findOne({ user: req.user._id });
      while (await DJProfile.findOne({ slug, _id: { $ne: current._id } })) {
        slug = `${baseSlug}-${counter++}`;
      }
      updates.slug = slug;
    }

    const dj = await DJProfile.findOneAndUpdate(
      { user: req.user._id }, updates, { new: true, runValidators: true }
    );
    if (!dj) return res.status(404).json({ success: false, message: 'DJ profile not found' });
    res.json({ success: true, data: dj });
  } catch (err) { next(err); }
};

// PATCH /api/djs/me/theme — update theme only
exports.updateTheme = async (req, res, next) => {
  try {
    const dj = await DJProfile.findOneAndUpdate(
      { user: req.user._id },
      { theme: req.body },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: dj });
  } catch (err) { next(err); }
};

// POST /api/djs/me/widgets — add widget
exports.addWidget = async (req, res, next) => {
  try {
    const dj = await DJProfile.findOne({ user: req.user._id });
    dj.widgets.push(req.body);
    await dj.save();
    res.json({ success: true, data: dj.widgets });
  } catch (err) { next(err); }
};

// DELETE /api/djs/me/widgets/:widgetId
exports.removeWidget = async (req, res, next) => {
  try {
    const dj = await DJProfile.findOneAndUpdate(
      { user: req.user._id },
      { $pull: { widgets: { _id: req.params.widgetId } } },
      { new: true }
    );
    res.json({ success: true, data: dj.widgets });
  } catch (err) { next(err); }
};
