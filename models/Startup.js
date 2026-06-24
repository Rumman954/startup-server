import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema(
  {
    startup_name: { type: String, required: true },
    logo: { type: String, default: '' },
    industry: { type: String, required: true },
    description: { type: String, required: true },
    funding_stage: { type: String, required: true },
    founder_email: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'removed'],
      default: 'pending',
    },
    team_size_needed: { type: Number, default: 5 },
  },
  { timestamps: true }
);

export default mongoose.model('Startup', startupSchema);
