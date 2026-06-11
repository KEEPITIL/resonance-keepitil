/**
 * Kickback / Referral Controller — RESONANCE
 *
 * Implements Posh's "Kickback" system:
 * - Organizers enable kickbacks on an event and set a reward % (e.g. 5%)
 * - Any user (host, promoter, attendee) can generate a unique referral code
 * - When someone buys a ticket using a code, the code owner earns the %
 * - Earnings accumulate in user.kickbackBalance, paid out via Stripe Connect
 */

const crypto = require('crypto');
const Event = require('../models/Event');
const User  = require('../models/User');

// ─── POST /api/events/:id/kickback/codes ─────────────────────────────────────
// Generate (or retrieve existing) a personal referral code for this event.
exports.generateCode = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select(
      'kickbackEnabled kickbackPercent kickbackCodes title status'
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!event.kickbackEnabled) {
      return res.status(400).json({ success: false, message: 'Kickbacks are not enabled for this event' });
    }
    if (!['published', 'sold_out'].includes(event.status)) {
      return res.status(400).json({ success: false, message: 'Event must be published to generate codes' });
    }

    const userId = req.user._id;

    // Return existing code if already generated
    const existing = event.kickbackCodes.find(
      (c) => c.user && c.user.toString() === userId.toString()
    );
    if (existing) {
      return res.json({
        success: true,
        data: {
          code: existing.code,
          kickbackPercent: event.kickbackPercent,
          uses: existing.uses,
          earnings: existing.earnings,
        },
      });
    }

    // Generate a short, memorable code: STAGENAME + 4 random hex chars
    const user = await User.findById(userId).select('firstName username');
    const base = (user?.username || user?.firstName || 'CREW')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${base}-${suffix}`;

    event.kickbackCodes.push({
      code,
      user: userId,
      name: user?.firstName || user?.username,
      isActive: true,
    });
    await event.save();

    res.status(201).json({
      success: true,
      message: `Your referral code is ${code}. Share it to earn ${event.kickbackPercent}% on every ticket sold.`,
      data: {
        code,
        kickbackPercent: event.kickbackPercent,
        uses: 0,
        earnings: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/events/:id/kickback/codes ─────────────────────────────────────
// Organizer: list all referral codes + stats for this event.
exports.listCodes = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      organizer: req.user._id,
    })
      .select('kickbackEnabled kickbackPercent kickbackCodes')
      .populate('kickbackCodes.user', 'firstName lastName email');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });

    res.json({
      success: true,
      kickbackPercent: event.kickbackPercent,
      data: event.kickbackCodes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/events/:id/kickback ────────────────────────────────────────────
// Organizer: enable/disable kickbacks and set the reward %.
exports.updateKickbackSettings = async (req, res) => {
  try {
    const { kickbackEnabled, kickbackPercent } = req.body;

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.user._id },
      {
        kickbackEnabled: Boolean(kickbackEnabled),
        ...(kickbackPercent !== undefined && {
          kickbackPercent: Math.min(Math.max(Number(kickbackPercent), 1), 50),
        }),
      },
      { new: true }
    ).select('kickbackEnabled kickbackPercent');

    if (!event) return res.status(404).json({ success: false, message: 'Event not found or unauthorized' });

    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/users/kickback/earnings ────────────────────────────────────────
// Authenticated user: get their total kickback earnings across all events.
exports.getMyEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'kickbackBalance kickbackPaid firstName'
    );

    // Also fetch a breakdown by event
    const events = await Event.find({ 'kickbackCodes.user': req.user._id })
      .select('title startDate kickbackCodes venue');

    const breakdown = events
      .map((ev) => {
        const code = ev.kickbackCodes.find(
          (c) => c.user && c.user.toString() === req.user._id.toString()
        );
        if (!code) return null;
        return {
          eventId:    ev._id,
          eventTitle: ev.title,
          startDate:  ev.startDate,
          city:       ev.venue?.city,
          code:       code.code,
          uses:       code.uses,
          earnings:   code.earnings,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        pendingBalance: user.kickbackBalance,
        lifetimePaid:   user.kickbackPaid,
        breakdown,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
