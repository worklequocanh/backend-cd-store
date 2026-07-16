import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied'],
      default: 'unread',
    },
    adminNotes: { type: String, default: '' },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1 });

export default mongoose.model('Contact', contactSchema);
