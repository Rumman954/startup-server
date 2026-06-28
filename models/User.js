import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: '' },
    role: {
      type: String,
      enum: ['founder', 'collaborator', 'admin'],
      default: 'collaborator',
    },
    isBlocked: { type: Boolean, default: false },
    skills: [{ type: String }],
    bio: { type: String, default: '' },
    isPremium: { type: Boolean, default: false },
    premiumPlan: {
      type: String,
      enum: ['', 'plus', 'pro', 'pro_plus'],
      default: '',
    },
    premiumBilling: {
      type: String,
      enum: ['', 'monthly', 'yearly'],
      default: '',
    },
    premiumExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
