/**
 * ExternalEvent Model — RESONANCE
 *
 * Stores third-party / aggregated events that are curated by admins for
 * discovery on the Explore map and Discover page.
 *
 * These events are NOT sold through RESONANCE — clicking them redirects
 * the user to the original platform (tracked via clickThroughs).
 *
 * Sources: Eventbrite, Posh, EDM Train, Ticketmaster, or manually entered.
 */

const mongoose = require('mongoose');

const SOURCE_PLATFORMS = ['eventbrite', 'posh', 'edm_train', 'ticketmaster', 'ra', 'dice', 'other'];

const EDM_GENRES = [
  'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 'Hardstyle',
  'Deep House', 'Tech House', 'Progressive House', 'Psytrance', 'Future Bass',
  'Trap', 'Garage', 'Breaks', 'Ambient', 'Industrial', 'EBM', 'Acid',
  'Melodic Techno', 'Afro House', 'Bass Music', 'Other',
];

const externalEventSchema = new mongoose.Schema(
  {
    // ── Core info ────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: 150,
    },
    artist: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    // Supporting lineup names (comma-separated or array)
    supportingActs: [{ type: String, trim: true }],
    description: { type: String, maxlength: 2000 },

    // ── Dates ────────────────────────────────────────────────────────────
    startDate: { type: Date, required: true },
    endDate:   { type: Date },
    doorsOpen: { type: Date },

    // ── Venue / Location ─────────────────────────────────────────────────
    venueName: { type: String, required: true, trim: true },
    address:   { type: String, trim: true },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: { type: String, default: 'CA' },
    zip:   { type: String },
    // Geo coords for Explore map
    lat:   { type: Number },
    lng:   { type: Number },
    ageRestriction: { type: Number, default: 18 },

    // ── Genre / type ─────────────────────────────────────────────────────
    genres: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'At least one genre is required',
      },
    },
    eventType: {
      type: String,
      enum: ['club_night', 'festival', 'warehouse', 'rooftop', 'outdoor', 'boat_party', 'concert', 'other'],
      default: 'club_night',
    },

    // ── Source platform ──────────────────────────────────────────────────
    source: {
      type: String,
      enum: SOURCE_PLATFORMS,
      required: true,
    },
    // Original URL on the source platform — what we redirect to
    externalTicketLink: {
      type: String,
      required: [true, 'External ticket link is required'],
      trim: true,
    },
    // Optional: display price copied from source platform
    priceDisplay: { type: String, trim: true },   // e.g. "$20–$45" or "Free"

    // ── Media ────────────────────────────────────────────────────────────
    posterImage:   { type: String },    // URL (copied from source or uploaded to S3)
    thumbnailImage:{ type: String },

    // ── Analytics / tracking ─────────────────────────────────────────────
    clickThroughs: { type: Number, default: 0 },
    // Detailed click log (kept for 90 days then can be pruned)
    clickLog: [{
      clickedAt: { type: Date, default: Date.now },
      userAgent:  String,
      // User ref if logged in
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],

    // ── Curation ─────────────────────────────────────────────────────────
    addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isFeatured:{ type: Boolean, default: false },
    isActive:  { type: Boolean, default: true },
    // Admin notes — internal only
    adminNotes:{ type: String, maxlength: 500, select: false },
  },
  { timestamps: true }
);

// Indexes
externalEventSchema.index({ startDate: 1, isActive: 1 });
externalEventSchema.index({ 'city': 1, startDate: 1 });
externalEventSchema.index({ genres: 1 });
externalEventSchema.index({ source: 1 });
externalEventSchema.index({ lat: 1, lng: 1 });
externalEventSchema.index({ isFeatured: -1, startDate: 1 });

// Helper to get the display name of the source platform
externalEventSchema.virtual('sourceName').get(function () {
  const names = {
    eventbrite: 'Eventbrite',
    posh:       'Posh',
    edm_train:  'EDM Train',
    ticketmaster: 'Ticketmaster',
    ra:         'Resident Advisor',
    dice:       'DICE',
    other:      'External',
  };
  return names[this.source] || this.source;
});

externalEventSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ExternalEvent', externalEventSchema);
