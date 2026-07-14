import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../src/models/Product.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const updatePrices = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cd-store');
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    
    for (let product of products) {
      // Divide price by 10,000. So 29,990,000 -> 2,999
      let newPrice = Math.max(2000, Math.floor(product.price / 10000));
      product.price = newPrice;
      
      if (product.discountPrice) {
        product.discountPrice = Math.max(2000, Math.floor(product.discountPrice / 10000));
      }
      
      await product.save();
    }
    
    console.log(`Successfully updated prices for ${products.length} products to be around 2,000 - 5,000 VND`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating prices:', error);
    process.exit(1);
  }
};

updatePrices();
