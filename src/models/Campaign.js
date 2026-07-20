import mongoose from 'mongoose';

const snapshotItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  originalPrice: { type: Number, required: true },
  originalDiscountPrice: { type: Number, default: null }
}, { _id: false });

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    badgeText: { type: String, default: 'SALE', trim: true },
    
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, default: null }, // Giảm tối đa (với type percent)
    
    targetType: { 
      type: String, 
      enum: ['all_products', 'by_categories', 'by_products'], 
      required: true 
    },
    targetCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    targetProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    
    isUnlimitedTime: { type: Boolean, default: false },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    
    status: { 
      type: String, 
      enum: ['draft', 'active', 'paused', 'ended'], 
      default: 'draft' 
    },
    
    // Snapshot lưu giá cũ của các sản phẩm đã được áp dụng để hoàn tác (revert) chuẩn xác
    appliedProductsSnapshot: [snapshotItemSchema]
  },
  { timestamps: true }
);

campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Campaign', campaignSchema);
