import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    payosOrderCode: { type: Number, unique: true, sparse: true },
    payosCheckoutUrl: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        price: Number,
        quantity: { type: Number, required: true, min: 1 },
        variant: String,
      },
    ],
    shippingAddress: {
      name: String,
      phone: String,
      address: String,
    },
    paymentMethod: { type: String, enum: ['cod', 'qr'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    orderStatus: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    couponCode: String,
    total: { type: Number, required: true },
    notes: String,
    trackingNumber: String,
    cancelledAt: Date,
    cancelReason: String,
    stockDeducted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    // Tạo mã đơn hàng theo cấu trúc cấu hình trên SePay: Bắt đầu bằng CDS, theo sau là 8 ký tự số và chữ viết hoa
    const randomSuffix = Math.random().toString(36).substring(2, 4).toUpperCase();
    const timeSlice = Date.now().toString().slice(-6);
    this.orderNumber = `CDS${timeSlice}${randomSuffix}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);
