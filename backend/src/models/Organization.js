const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: String,
    logo: String,
    banner: String,
    website: String,
    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
    },
    location: {
      city: String,
      state: { type: String, default: 'CA' },
    },
    // Stripe Connect for payouts
    stripeConnectAccountId: String,
    stripeConnectOnboarded: { type: Boolean, default: false },
    // Team members
    members: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
      addedAt: { type: Date, default: Date.now },
    }],
    isVerified: { type: Boolean, default: false },
    totalEvents: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
