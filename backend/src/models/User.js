const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['attendee', 'dj', 'organizer', 'admin'],
      default: 'attendee',
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    location: {
      city: String,
      state: { type: String, default: 'CA' },
    },
    // Stripe
    stripeCustomerId: { type: String },
    stripeConnectAccountId: { type: String },
    // Tokens
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String,
    lastLogin: Date,
    // Age gate
    ageVerified: { type: Boolean, default: false },
    ageVerifiedAt: Date,
    // Referral / Kickback (Posh)
    referralCode: { type: String, unique: true, sparse: true },   // e.g. "USER-A7X3K"
    kickbackBalance: { type: Number, default: 0 },                // total earned, pending payout
    kickbackPaid: { type: Number, default: 0 },                   // lifetime paid out
    // Artist follow system (EDM Train)
    followingDJs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DJProfile' }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isAdult = function () {
  if (!this.dateOfBirth) return false;
  const age = Math.floor(
    (Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  return age >= 18;
};

userSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

module.exports = mongoose.model('User', userSchema);
