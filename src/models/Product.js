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

export default mongoose.model('Product', productSchema);
