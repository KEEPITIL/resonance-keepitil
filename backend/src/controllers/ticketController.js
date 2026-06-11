const QRCode = require('qrcode');
const Event = require('../models/Event');
const { Ticket } = require('../models/Booking');
const { getOrCreateCustomer, createTicketPaymentIntent, constructWebhookEvent } = require('../services/stripeService');
const { uploadBuffer } = require('../services/s3Service');
const { sendTicketConfirmation } = require('../services/emailService');

// POST /api/tickets/checkout — create payment intent
exports.createCheckout = async (req, res, next) => {
  try {
    const { eventId, tierId, quantity = 1 } = req.body;

    // Age check
    if (!req.user.ageVerified) {
      return res.status(403).json({ success: false, message: 'Age verification required. Must be 18+.' });
    }

    const event = await Event.findById(eventId);
    if (!event || event.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Event not found or unavailable' });
    }

    const tier = event.ticketTiers.id(tierId);
    if (!tier || !tier.isActive) {
      return res.status(400).json({ success: false, message: 'Ticket tier unavailable' });
    }

    const remaining = tier.quantity - tier.quantitySold;
    if (remaining < quantity) {
      return res.status(400).json({ success: false, message: `Only ${remaining} tickets remaining` });
    }

    const subtotal = tier.price * quantity;
    const platformFee = parseFloat((subtotal * 0.025).toFixed(2));
    const total = subtotal + platformFee;

    const customerId = await getOrCreateCustomer(req.user);
    const { clientSecret, paymentIntentId } = await createTicketPaymentIntent({
      amount: total,
      customerId,
      eventId,
      metadata: { tierId: tierId.toString(), quantity: quantity.toString(), userId: req.user._id.toString() },
    });

    // Create pending ticket
    const ticket = await Ticket.create({
      buyer: req.user._id,
      event: eventId,
      ticketTierId: tierId,
      tierName: tier.name,
      quantity,
      unitPrice: tier.price,
      subtotal,
      platformFee,
      total,
      stripePaymentIntentId: paymentIntentId,
      ageVerified: req.user.ageVerified,
    });

    res.json({
      success: true,
      clientSecret,
      ticket: { id: ticket._id, total, platformFee, subtotal },
    });
  } catch (err) { next(err); }
};

// POST /api/tickets/webhook — Stripe webhook
exports.stripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = constructWebhookEvent(req.body, sig);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const ticket = await Ticket.findOne({ stripePaymentIntentId: pi.id }).populate('event buyer');
      if (!ticket) return res.sendStatus(200);

      // Confirm ticket
      ticket.status = 'confirmed';
      ticket.stripeChargeId = pi.latest_charge;

      // Generate QR code
      const qrData = JSON.stringify({ ticketNumber: ticket.ticketNumber, eventId: ticket.event._id });
      const qrBuffer = await QRCode.toBuffer(qrData, { type: 'png', width: 400, margin: 2 });
      const qrKey = `qrcodes/${ticket.ticketNumber}.png`;
      const qrUrl = await uploadBuffer(qrBuffer, qrKey, 'image/png');
      ticket.qrCodeData = qrUrl;

      // Update ticket tier quantity
      await Event.updateOne(
        { _id: ticket.event._id, 'ticketTiers._id': ticket.ticketTierId },
        { $inc: { 'ticketTiers.$.quantitySold': ticket.quantity, totalTicketsSold: ticket.quantity, totalRevenue: ticket.total } }
      );

      await ticket.save();

      // Send confirmation email
      if (ticket.buyer?.email) {
        await sendTicketConfirmation(ticket.buyer.email, {
          ticketNumber: ticket.ticketNumber,
          eventTitle: ticket.event.title,
          eventDate: ticket.event.startDate,
          venueName: ticket.event.venue?.name,
          tierName: ticket.tierName,
          quantity: ticket.quantity,
          total: ticket.total,
          qrCodeUrl: qrUrl,
        });
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      await Ticket.findOneAndUpdate(
        { stripePaymentIntentId: pi.id },
        { status: 'cancelled' }
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// GET /api/tickets/my — buyer's tickets
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ buyer: req.user._id, status: { $ne: 'cancelled' } })
      .populate('event', 'title startDate venue coverImage slug status')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) { next(err); }
};

// GET /api/tickets/:ticketNumber — single ticket
exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({
      ticketNumber: req.params.ticketNumber,
      buyer: req.user._id,
    }).populate('event', 'title startDate venue coverImage');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
};

// POST /api/tickets/:ticketNumber/check-in — staff check-in
exports.checkIn = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ ticketNumber: req.params.ticketNumber });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.status === 'checked_in') return res.status(400).json({ success: false, message: 'Already checked in' });
    if (ticket.status !== 'confirmed') return res.status(400).json({ success: false, message: 'Ticket not confirmed' });

    ticket.status = 'checked_in';
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = req.user._id;
    await ticket.save();
    res.json({ success: true, message: 'Checked in', ticket });
  } catch (err) { next(err); }
};
