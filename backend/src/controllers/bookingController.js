const { DJBooking } = require('../models/Booking');
const DJProfile = require('../models/DJProfile');
const { sendBookingRequest, sendBookingConfirmation } = require('../services/emailService');
const User = require('../models/User');

// POST /api/bookings — organizer sends inquiry
exports.createBooking = async (req, res, next) => {
  try {
    const { djProfileId, eventId, proposedFee, performanceDate, setDuration, setTime, notes } = req.body;

    const djProfile = await DJProfile.findById(djProfileId).populate('user', 'email firstName');
    if (!djProfile) return res.status(404).json({ success: false, message: 'DJ not found' });
    if (!djProfile.bookingEnabled) return res.status(400).json({ success: false, message: 'DJ is not accepting bookings' });

    const booking = await DJBooking.create({
      dj: djProfileId,
      organizer: req.user._id,
      event: eventId || undefined,
      proposedFee,
      performanceDate,
      setDuration,
      setTime,
      notes,
    });

    // Notify DJ
    const djEmail = djProfile.bookingEmail || djProfile.user?.email;
    if (djEmail) {
      await sendBookingRequest(djEmail, {
        djName: djProfile.stageName,
        organizerName: req.user.fullName || req.user.email,
        eventTitle: req.body.eventTitle,
        proposedFee,
        performanceDate,
        bookingRef: booking.bookingRef,
      });
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// PATCH /api/bookings/:ref/respond — DJ accepts or declines
exports.respondToBooking = async (req, res, next) => {
  try {
    const { action, agreedFee } = req.body; // action: 'accept' | 'decline'
    const djProfile = await DJProfile.findOne({ user: req.user._id });
    if (!djProfile) return res.status(403).json({ success: false, message: 'DJ profile required' });

    const booking = await DJBooking.findOne({ bookingRef: req.params.ref, dj: djProfile._id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (action === 'accept') {
      booking.status = 'accepted';
      booking.agreedFee = agreedFee || booking.proposedFee;
      booking.platformFee = parseFloat((booking.agreedFee * 0.025).toFixed(2));
      booking.respondedAt = new Date();

      // Notify organizer
      const organizer = await User.findById(booking.organizer);
      if (organizer?.email) {
        await sendBookingConfirmation(organizer.email, {
          djName: djProfile.stageName,
          organizerName: organizer.fullName,
          agreedFee: booking.agreedFee,
          performanceDate: booking.performanceDate,
          bookingRef: booking.bookingRef,
        });
      }
    } else {
      booking.status = 'declined';
      booking.respondedAt = new Date();
    }

    await booking.save();
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// GET /api/bookings/my — organizer's bookings
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await DJBooking.find({ organizer: req.user._id })
      .populate('dj', 'stageName slug profilePhoto')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
};

// GET /api/bookings/dj — DJ's incoming bookings
exports.getDJBookings = async (req, res, next) => {
  try {
    const djProfile = await DJProfile.findOne({ user: req.user._id });
    if (!djProfile) return res.status(404).json({ success: false, message: 'DJ profile not found' });

    const bookings = await DJBooking.find({ dj: djProfile._id })
      .populate('organizer', 'firstName lastName email')
      .populate('event', 'title startDate venue')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
};

// POST /api/bookings/:ref/message
exports.sendMessage = async (req, res, next) => {
  try {
    const djProfile = await DJProfile.findOne({ user: req.user._id });
    const booking = await DJBooking.findOne({
      bookingRef: req.params.ref,
      $or: [
        { organizer: req.user._id },
        { dj: djProfile?._id },
      ],
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.messages.push({ sender: req.user._id, content: req.body.content });
    await booking.save();
    res.json({ success: true, data: booking.messages });
  } catch (err) { next(err); }
};
