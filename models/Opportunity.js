import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema(
  {
    startup_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Startup',
      required: true,
    },
    role_title: { type: String, required: true },
    required_skills: [{ type: String }],
    work_type: {
      type: String,
      enum: ['remote', 'hybrid', 'onsite'],
      required: true,
    },
    commitment_level: {
      type: String,
      enum: ['full-time', 'part-time', 'contract'],
      required: true,
    },
    deadline: { type: Date, required: true },
    founder_email: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('Opportunity', opportunitySchema);
