const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema({
  instagram: String,
  soundcloud: String,
  spotify: String,
  youtube: String,
  facebook: String,
  twitter: String,
  tiktok: String,
  website: String,
}, { _id: false });

const widgetSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['spotify_track', 'spotify_playlist', 'soundcloud_track', 'youtube_video', 'upcoming_events', 'booking_form', 'photo_gallery'],
  },
  url: String,
  embedId: String,
  title: String,
  order: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
}, { _id: true });

const djProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    stageName: {
      type: String,
      required: [true, 'Stage name is required'],
      trim: true,
      maxlength: 60,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    genres: [{
      type: String,
      enum: [
        'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 'EDM',
        'Hardstyle', 'Deep House', 'Tech House', 'Progressive House',
        'Electro', 'Future Bass', 'Melodic Techno', 'Psytrance', 'Ambient',
        'Trap', 'Bass Music', 'UK Garage', 'Jungle', 'Breaks'
      ],
    }],
    bio: { type: String, maxlength: 2000 },
    shortBio: { type: String, maxlength: 200 },
    // Media
    profilePhoto: String,
    bannerImage: String,
    logoImage: String,
    galleryImages: [String],
    // Customization
    theme: {
      primaryColor: { type: String, default: '#CC0088' },
      secondaryColor: { type: String, default: '#00FFFF' },
      accentColor: { type: String, default: '#9900FF' },
      backgroundColor: { type: String, default: '#0A0A0A' },
      textColor: { type: String, default: '#FFFFFF' },
      fontFamily: {
        type: String,
        enum: ['Orbitron', 'Space Mono', 'Rajdhani', 'Exo 2', 'Play'],
        default: 'Orbitron',
      },
      backgroundStyle: {
        type: String,
        enum: ['solid', 'gradient', 'image', 'video'],
        default: 'gradient',
      },
      customBackground: String,
    },
    socialLinks: { type: socialLinksSchema, default: {} },
    widgets: [widgetSchema],
    // Booking
    bookingEnabled: { type: Boolean, default: true },
    bookingEmail: String,
    minBookingFee: { type: Number, default: 0 },
    maxBookingFee: { type: Number },
    bookingNotes: String,
    // Location
    homeCity: String,
    willingToTravel: { type: Boolean, default: true },
    travelRadius: Number, // miles
    // Stats
    totalBookings: { type: Number, default: 0 },
    totalEvents: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    // Meta
    isVerified: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    profileViews: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

djProfileSchema.index({ slug: 1 });
djProfileSchema.index({ genres: 1 });
djProfileSchema.index({ isFeatured: -1, rating: -1 });
djProfileSchema.index({ 'theme.primaryColor': 1 });

module.exports = mongoose.model('DJProfile', djProfileSchema);
