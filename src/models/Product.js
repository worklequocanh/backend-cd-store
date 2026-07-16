import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    shortDescription: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: String },
    images: [String],
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    discountPercent: { type: Number, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, unique: true },
    weight: { type: Number },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    variants: [
      {
        name: String,
        options: [String],
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    tags: [String],
    isActive: { type: Boolean, default: true },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

productSchema.pre('save', function (next) {
  if (this.discountPrice && Number(this.discountPrice) > Number(this.price)) {
    this.discountPercent = Math.round(((this.discountPrice - this.price) / this.discountPrice) * 100);
  } else {
    this.discountPrice = null;
    this.discountPercent = 0;
  }
  next();
});

productSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update) {
    const target = update.$set || update;
    if (target.discountPrice !== undefined || target.price !== undefined) {
      const dp = target.discountPrice;
      const pr = target.price;
      if (dp && pr && Number(dp) > Number(pr)) {
        target.discountPercent = Math.round(((dp - pr) / dp) * 100);
      } else if (dp !== undefined && (dp === null || Number(dp) <= Number(pr || 0))) {
        target.discountPrice = null;
        target.discountPercent = 0;
      }
    }
  }
  next();
});

export default mongoose.model('Product', productSchema);
