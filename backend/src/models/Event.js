const mongoose = require('mongoose');

const ticketTierSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g. "General Admission", "VIP"
  description: String,
  price: { type: Number, required: true, min: 0 },
  // All-in pricing (Eventbrite/CA law) — show total to buyer upfront
  serviceFee: { type: Number, default: 0 },     // platform fee in dollars
  displayPrice: { type: Number },               // price + serviceFee; computed pre-save
  quantity: { type: Number, required: true },
  quantitySold: { type: Number, default: 0 },
  maxPerOrder: { type: Number, default: 10 },
  // Early-bird / timed pricing (Eventbrite)
  saleStartDate: Date,
  saleEndDate: Date,
  // Visibility controls (Posh)
  isVisible: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  // Password-protected tier (Posh / Eventbrite)
  isPasswordProtected: { type: Boolean, default: false },
  password: { type: String, select: false },    // stripped from public responses
  // Approval-required tickets (Posh)
  requiresApproval: { type: Boolean, default: false },
  // Check-in time window (Eventbrite)
  checkInWindowStart: Date,
  checkInWindowEnd: Date,
}, { _id: true });

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  city: { type: String, required: true },
  state: { type: String, default: 'CA' },
  zip: String,
  lat: Number,
  lng: Number,
  capacity: Number,
  ageRestriction: { type: Number, default: 18 },
}, { _id: false });

const lineupSchema = new mongoose.Schema({
  dj: { type: mongoose.Schema.Types.ObjectId, ref: 'DJProfile' },
  djName: String,      // fallback if not a platform user
  startTime: String,
  endTime: String,
  isHeadliner: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 120,
    },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, maxlength: 5000 },
    shortDescription: { type: String, maxlength: 300 },
    // Dates
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    doorsOpen: Date,
    // Venue
    venue: venueSchema,
    // Media
    coverImage: String,
    galleryImages: [String],
    promoVideoUrl: String,
    // Genres / type
    genres: [String],
    eventType: {
      type: String,
      enum: ['club_night', 'festival', 'warehouse', 'rooftop', 'outdoor', 'boat_party', 'private', 'other'],
      default: 'club_night',
    },
    // Lineup
    lineup: [lineupSchema],
    // Tickets
    ticketTiers: [ticketTierSchema],
    totalCapacity: Number,
    // Pricing
    isFree: { type: Boolean, default: false },
    minPrice: Number,
    maxPrice: Number,
    // Status
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'postponed', 'sold_out', 'completed'],
      default: 'draft',
    },
    isPrivate: { type: Boolean, default: false },
    ageRestriction: { type: Number, default: 18 },
    // Stripe
    stripeProductId: String,
    // Analytics
    viewCount: { type: Number, default: 0 },
    totalTicketsSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    // Tags
    tags: [String],
    isFeatured: { type: Boolean, default: false },

    // ── Waitlist (Eventbrite) ──────────────────────────────────────────────
    // Stores interest for sold-out events; notified when capacity reopens
    waitlist: [{
      user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email:     String,                     // for guests without accounts
      firstName: String,
      lastName:  String,
      quantity:  { type: Number, default: 1 },
      tierId:    mongoose.Schema.Types.ObjectId,
      joinedAt:  { type: Date, default: Date.now },
      notified:  { type: Boolean, default: false },
      notifiedAt: Date,
    }],
    waitlistEnabled: { type: Boolean, default: true },

    // ── Guest List (Posh) ─────────────────────────────────────────────────
    // Complimentary access list — names added by organizer / host
    guestList: [{
      name:     { type: String, required: true },
      addedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      plusOnes: { type: Number, default: 0 },
      note:     String,
      checkedIn:    { type: Boolean, default: false },
      checkedInAt:  Date,
      addedAt:  { type: Date, default: Date.now },
    }],

    // ── Referral / Kickback System (Posh) ────────────────────────────────
    kickbackEnabled:  { type: Boolean, default: false },
    kickbackPercent:  { type: Number, default: 5, min: 1, max: 50 },   // % of ticket price
    kickbackCodes: [{
      code:     { type: String, required: true },   // short promo code, e.g. "SPEKTR10"
      user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name:     String,                             // display name
      uses:     { type: Number, default: 0 },
      revenue:  { type: Number, default: 0 },       // total ticket revenue driven
      earnings: { type: Number, default: 0 },       // kickback amount earned
      isActive: { type: Boolean, default: true },
    }],

    // ── Community Submission (EDM Train) ──────────────────────────────────
    submittedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isUserSubmitted: { type: Boolean, default: false },
    submissionStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',   // organizer-created events auto-approved
    },

    // ── Password-protected event (Posh) ──────────────────────────────────
    eventPassword: { type: String, select: false },
    requiresEventPassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ 'venue.city': 1, startDate: 1 });
eventSchema.index({ genres: 1 });
eventSchema.index({ isFeatured: -1, startDate: 1 });
eventSchema.index({ slug: 1 });
eventSchema.index({ 'venue.lat': 1, 'venue.lng': 1 });

const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5') / 100;

// Compute displayPrice (all-in), min/max, and totalCapacity before save
eventSchema.pre('save', function (next) {
  if (this.ticketTiers && this.ticketTiers.length > 0) {
    this.ticketTiers.forEach((tier) => {
      // All-in pricing: compute the exact Stripe fee upfront so buyers see full cost
      if (tier.price > 0) {
        const platformFee = parseFloat((tier.price * PLATFORM_FEE_RATE).toFixed(2));
        tier.serviceFee   = platformFee;
        tier.displayPrice = parseFloat((tier.price + platformFee).toFixed(2));
      } else {
        tier.serviceFee   = 0;
        tier.displayPrice = 0;
      }
    });
    const prices = this.ticketTiers.map((t) => t.displayPrice ?? t.price);
    this.minPrice      = Math.min(...prices);
    this.maxPrice      = Math.max(...prices);
    this.totalCapacity = this.ticketTiers.reduce((sum, t) => sum + t.quantity, 0);
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
