const Event = require('../models/Event');
const { Ticket } = require('../models/Booking');

// GET /api/analytics/organizer — organizer dashboard stats
exports.getOrganizerAnalytics = async (req, res, next) => {
  try {
    const organizerId = req.user._id;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const events = await Event.find({ organizer: organizerId }).select('_id title startDate totalTicketsSold totalRevenue status viewCount');

    const eventIds = events.map((e) => e._id);

    const ticketStats = await Ticket.aggregate([
      { $match: { event: { $in: eventIds }, status: { $in: ['confirmed', 'checked_in'] } } },
      {
        $group: {
          _id: '$event',
          ticketsSold: { $sum: '$quantity' },
          revenue: { $sum: '$subtotal' },
          platformFees: { $sum: '$platformFee' },
          checkIns: { $sum: { $cond: [{ $eq: ['$status', 'checked_in'] }, '$quantity', 0] } },
        },
      },
    ]);

    const statsMap = {};
    ticketStats.forEach((s) => { statsMap[s._id.toString()] = s; });

    const enriched = events.map((e) => ({
      ...e.toObject(),
      stats: statsMap[e._id.toString()] || { ticketsSold: 0, revenue: 0, platformFees: 0, checkIns: 0 },
    }));

    const totals = ticketStats.reduce(
      (acc, s) => ({
        totalRevenue: acc.totalRevenue + s.revenue,
        totalTicketsSold: acc.totalTicketsSold + s.ticketsSold,
        totalPlatformFees: acc.totalPlatformFees + s.platformFees,
      }),
      { totalRevenue: 0, totalTicketsSold: 0, totalPlatformFees: 0 }
    );

    // Sales over time (last 30 days)
    const salesOverTime = await Ticket.aggregate([
      { $match: { event: { $in: eventIds }, status: 'confirmed', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$subtotal' }, count: { $sum: '$quantity' } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        events: enriched,
        totals,
        salesOverTime,
      },
    });
  } catch (err) { next(err); }
};

// GET /api/analytics/event/:eventId — per-event analytics
exports.getEventAnalytics = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.eventId, organizer: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const tickets = await Ticket.find({ event: event._id, status: { $in: ['confirmed', 'checked_in'] } })
      .populate('buyer', 'firstName lastName email createdAt');

    const tierBreakdown = await Ticket.aggregate([
      { $match: { event: event._id, status: { $in: ['confirmed', 'checked_in'] } } },
      { $group: { _id: '$tierName', sold: { $sum: '$quantity' }, revenue: { $sum: '$subtotal' } } },
    ]);

    res.json({
      success: true,
      data: {
        event,
        tickets,
        tierBreakdown,
        totalCheckIns: tickets.filter((t) => t.status === 'checked_in').length,
        checkInRate: event.totalTicketsSold
          ? ((tickets.filter((t) => t.status === 'checked_in').length / event.totalTicketsSold) * 100).toFixed(1)
          : 0,
      },
    });
  } catch (err) { next(err); }
};
