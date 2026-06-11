/**
 * Waitlist Controller — RESONANCE
 *
 * Handles sold-out event waitlists (inspired by Eventbrite).
 * - Attendees join with email + quantity + optional tier preference
 * - Organizers can view, notify, and clear the waitlist
 * - Auto-notification email sent when capacity reopens
 */

const Event = require('../models/Event');
const { sendWaitlistNotification } = require('../services/emailService');

// ─── POST /api/events/:id/waitlist ───────────────────────────────────────────
// Join the waitlist for a sold-out event.
exports.joinWaitlist = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select(
      'title status waitlist waitlistEnabled ticketTiers venue startDate organizer'
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.waitlistEnabled) {
      return res.status(400).json({ success: false, message: 'Waitlist is not enabled for this event' });
    }

    const { email, firstName, lastName, quantity = 1, tierId } = req.body;
    const userId = req.user?._id;

    if (!email && !userId) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Prevent duplicates
    const existingEmail = email || req.user?.email;
    const alreadyJoined = event.waitlist.some(
      (w) =>
        (w.email && w.email === existingEmail) ||
        (userId && w.user && w.user.toString() === userId.toString())
    );
    if (alreadyJoined) {
      return res.status(409).json({ success: false, message: "You're already on the waitlist" });
    }

    event.waitlist.push({
      user: userId || undefined,
      email: existingEmail,
      firstName: firstName || req.user?.firstName,
      lastName: lastName || req.user?.lastName,
      quantity: Math.min(Number(quantity), 10),
      tierId: tierId || undefined,
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: "You're on the waitlist! We'll email you if tickets become available.",
      position: event.waitlist.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/events/:id/waitlist ────────────────────────────────────────
// Leave the waitlist (authenticated user only).
exports.leaveWaitlist = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('waitlist title');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const userId = req.user._id;
    const before = event.waitlist.length;
    event.waitlist = event.waitlist.filter(
      (w) => !w.user || w.user.toString() !== userId.toString()
    );

    if (event.waitlist.length === before) {
      return res.status(404).json({ success: false, message: 'You are not on this waitlist' });
    }

    await event.save();
    res.json({ success: true, message: 'Removed from waitlist' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/events/:id/waitlist ────────────────────────────────────────────
// View waitlist — organizer/admin only.
exports.getWaitlist = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    })
      .select('title waitlist')
      .populate('waitlist.user', 'firstName lastName email');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });

    res.json({
      success: true,
      count: event.waitlist.length,
      data: event.waitlist,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/events/:id/waitlist/notify ────────────────────────────────────
// Organizer manually notifies waitlisted users that tickets are available.
// Accepts optional `limit` to notify only the first N entries.
exports.notifyWaitlist = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    }).populate('waitlist.user', 'firstName email');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });

    const limit = parseInt(req.body.limit) || event.waitlist.length;
    const toNotify = event.waitlist.filter((w) => !w.notified).slice(0, limit);

    if (!toNotify.length) {
      return res.json({ success: true, message: 'No un-notified entries on the waitlist', notified: 0 });
    }

    const emailPromises = toNotify.map((entry) => {
      const email = entry.email || entry.user?.email;
      const name  = entry.firstName || entry.user?.firstName || 'Friend';
      if (!email) return Promise.resolve();
      return sendWaitlistNotification({ email, name, event });
    });

    await Promise.allSettled(emailPromises);

    // Mark as notified
    const notifiedIds = toNotify.map((w) => w._id.toString());
    event.waitlist.forEach((w) => {
      if (notifiedIds.includes(w._id.toString())) {
        w.notified = true;
        w.notifiedAt = new Date();
      }
    });
    await event.save();

    res.json({
      success: true,
      message: `Notified ${toNotify.length} waitlist entries`,
      notified: toNotify.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
