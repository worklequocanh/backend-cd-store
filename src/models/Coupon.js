import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    maxUsage: { type: Number },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date, required: true },
    expiredAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    description: String,
  },
  { timestamps: true }
);

export default mongoose.model('Coupon', couponSchema);
