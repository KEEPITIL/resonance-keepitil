const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// ── Ticket (attendee purchase) ───────────────────────────────────────────────
const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true, default: () => `RSN-${uuidv4().toUpperCase().slice(0, 8)}` },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketTierId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tierName: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    platformFee: { type: Number, required: true },     // 2.5%
    total: { type: Number, required: true },
    // Stripe
    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    stripeChargeId: String,
    // Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded', 'checked_in'],
      default: 'pending',
    },
    // QR
    qrCodeData: String,
    checkedInAt: Date,
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Age verification record
    ageVerified: { type: Boolean, default: false },
    refundedAt: Date,
    refundReason: String,
  },
  { timestamps: true }
);

// ── DJ Booking (organizer ↔ DJ) ───────────────────────────────────────────────
const djBookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, unique: true, default: () => `DJB-${uuidv4().toUpperCase().slice(0, 8)}` },
    dj: { type: mongoose.Schema.Types.ObjectId, ref: 'DJProfile', required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    // Offer details
    proposedFee: { type: Number, required: true },
    agreedFee: Number,
    platformFee: Number,       // 2.5% of agreed fee
    currency: { type: String, default: 'usd' },
    performanceDate: Date,
    setDuration: Number,       // minutes
    setTime: String,           // e.g. "11:00 PM - 1:00 AM"
    notes: String,
    // Status flow
    status: {
      type: String,
      enum: ['inquiry', 'pending', 'accepted', 'declined', 'cancelled', 'completed', 'paid'],
      default: 'inquiry',
    },
    // Stripe
    stripePaymentIntentId: String,
    paidAt: Date,
    // Messages
    messages: [{
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      content: String,
      sentAt: { type: Date, default: Date.now },
    }],
    respondedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

ticketSchema.index({ buyer: 1, status: 1 });
ticketSchema.index({ event: 1, status: 1 });
ticketSchema.index({ ticketNumber: 1 });

djBookingSchema.index({ dj: 1, status: 1 });
djBookingSchema.index({ organizer: 1, status: 1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
const DJBooking = mongoose.model('DJBooking', djBookingSchema);

module.exports = { Ticket, DJBooking };
