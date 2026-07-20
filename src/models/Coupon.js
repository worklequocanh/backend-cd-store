import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    
    // Giới hạn tổng số lượt sử dụng trên toàn hệ thống (null/0 = không giới hạn tổng lượt)
    maxUsage: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    
    // Giới hạn số lần sử dụng cho mỗi tài khoản/người dùng (ví dụ: 1 = mỗi người chỉ dùng 1 lần)
    usagePerUserLimit: { type: Number, default: 1 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Yêu cầu đặc biệt: Chỉ người đã gửi thông tin (đăng ký VIP / Newsletter) mới được dùng
    requiresNewsletter: { type: Boolean, default: false },
    
    // Khách hàng cụ thể / Mã định danh riêng (nếu muốn mã chỉ dành riêng cho 1 vài email/tài khoản cụ thể)
    allowedEmails: [{ type: String, lowercase: true, trim: true }],
    
    // Thời gian: Giới hạn thời gian hoặc Không giới hạn thời gian (Vĩnh viễn)
    isUnlimitedTime: { type: Boolean, default: false },
    startDate: { type: Date, default: Date.now },
    expiredAt: { type: Date }, // Có thể null nếu isUnlimitedTime = true
    
    isActive: { type: Boolean, default: true },
    description: String,
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiredAt: 1 });

export default mongoose.model('Coupon', couponSchema);
