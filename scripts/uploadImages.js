import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../src/models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imagesDir = path.join(__dirname, '..', '..', 'images');

const uploadImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const files = fs.readdirSync(imagesDir);
    console.log(`Found ${files.length} images in directory.`);

    for (const file of files) {
      if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;

      const filePath = path.join(imagesDir, file);
      // Remove extension to get the product name
      let productName = path.parse(file).name;
      
      // Some files don't have quotes like 'MacBook Pro 14' but DB has 'MacBook Pro 14"'
      // We will do a regex search to match the product name flexibly
      const searchRegex = new RegExp(productName.replace(/[^a-zA-Z0-9]/g, '.*'), 'i');

      const product = await Product.findOne({ name: { $regex: searchRegex } });

      if (product) {
        console.log(`Uploading ${file} for product: ${product.name}...`);
        
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'cd-store/products',
        });

        product.images = [result.secure_url];
        await product.save();
        console.log(`✅ Success: Updated ${product.name}`);
      } else {
        console.log(`❌ Skipped: Could not find product matching image name: ${productName}`);
      }
    }

    console.log('Upload process completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

uploadImages();
