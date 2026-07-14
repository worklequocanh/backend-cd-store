import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import User from '../src/models/User.js';

dotenv.config();

const categories = [
  { name: 'Laptops', slug: 'laptops', description: 'High-performance laptops' },
  { name: 'Smartphones', slug: 'smartphones', description: 'Latest smartphones' },
  { name: 'Tablets', slug: 'tablets', description: 'Portable tablets' },
  { name: 'Headphones', slug: 'headphones', description: 'Audio devices' },
  { name: 'Smartwatches', slug: 'smartwatches', description: 'Wearable devices' },
];

const users = [
  {
    name: 'Test User',
    email: 'user@email.com',
    phone: '0912345678',
    passwordHash: '123456',
    role: 'user',
    status: 'active',
  },
  {
    name: 'Admin User',
    email: 'admin@email.com',
    phone: '0987654321',
    passwordHash: 'admin123',
    role: 'admin',
    status: 'active',
  },
];

const products = [
  // Laptops
  {
    name: 'MacBook Pro 14"',
    slug: 'macbook-pro-14',
    sku: 'SKU-APPLE-MBP-14-001',
    description: 'Powerful laptop with M3 Pro chip, 16GB RAM, 512GB SSD',
    categoryId: 0,
    brand: 'Apple',
    price: 1999,
    stock: 15,
    images: ['https://via.placeholder.com/400x300?text=MacBook+Pro'],
    rating: 4.8,
    tags: ['laptop', 'apple', 'professional'],
  },
  {
    name: 'Dell XPS 15',
    slug: 'dell-xps-15',
    sku: 'SKU-DELL-XPS-15-002',
    description: 'Ultra-premium Windows laptop with NVIDIA RTX 4080',
    categoryId: 0,
    brand: 'Dell',
    price: 2499,
    stock: 10,
    images: ['https://via.placeholder.com/400x300?text=Dell+XPS+15'],
    rating: 4.7,
    tags: ['laptop', 'dell', 'gaming'],
  },
  {
    name: 'Lenovo ThinkPad X1',
    slug: 'lenovo-thinkpad-x1',
    sku: 'SKU-LENOVO-TP-X1-003',
    description: 'Business laptop with excellent keyboard',
    categoryId: 0,
    brand: 'Lenovo',
    price: 1299,
    stock: 20,
    images: ['https://via.placeholder.com/400x300?text=ThinkPad+X1'],
    rating: 4.6,
    tags: ['laptop', 'lenovo', 'business'],
  },
  {
    name: 'HP Pavilion 15',
    slug: 'hp-pavilion-15',
    sku: 'SKU-HP-PAV-15-004',
    description: 'Affordable everyday laptop',
    categoryId: 0,
    brand: 'HP',
    price: 699,
    stock: 25,
    images: ['https://via.placeholder.com/400x300?text=HP+Pavilion'],
    rating: 4.2,
    tags: ['laptop', 'hp', 'budget'],
  },
  {
    name: 'ASUS VivoBook 16',
    slug: 'asus-vivobook-16',
    sku: 'SKU-ASUS-VB-16-005',
    description: 'Large screen laptop for productivity',
    categoryId: 0,
    brand: 'ASUS',
    price: 899,
    stock: 18,
    images: ['https://via.placeholder.com/400x300?text=ASUS+VivoBook'],
    rating: 4.5,
    tags: ['laptop', 'asus', 'productive'],
  },
  {
    name: 'Microsoft Surface Laptop 5',
    slug: 'microsoft-surface-laptop-5',
    sku: 'SKU-MS-SL5-006',
    description: 'Elegant Windows laptop',
    categoryId: 0,
    brand: 'Microsoft',
    price: 1299,
    stock: 12,
    images: ['https://via.placeholder.com/400x300?text=Surface+Laptop'],
    rating: 4.6,
    tags: ['laptop', 'microsoft', 'elegant'],
  },

  // Smartphones
  {
    name: 'iPhone 15 Pro Max',
    slug: 'iphone-15-pro-max',
    sku: 'SKU-APPLE-IP15PM-007',
    description: 'Latest Apple flagship phone with A17 Bionic',
    categoryId: 1,
    brand: 'Apple',
    price: 1199,
    stock: 30,
    images: ['https://via.placeholder.com/400x300?text=iPhone+15+Pro'],
    rating: 4.9,
    tags: ['smartphone', 'apple', 'flagship'],
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    sku: 'SKU-SAM-GS24U-008',
    description: 'Premium Android phone with S Pen',
    categoryId: 1,
    brand: 'Samsung',
    price: 1299,
    stock: 25,
    images: ['https://via.placeholder.com/400x300?text=Galaxy+S24'],
    rating: 4.8,
    tags: ['smartphone', 'samsung', 'flagship'],
  },
  {
    name: 'Google Pixel 8 Pro',
    slug: 'google-pixel-8-pro',
    sku: 'SKU-GOOGLE-P8P-009',
    description: 'Google phone with advanced AI features',
    categoryId: 1,
    brand: 'Google',
    price: 999,
    stock: 20,
    images: ['https://via.placeholder.com/400x300?text=Pixel+8+Pro'],
    rating: 4.7,
    tags: ['smartphone', 'google', 'ai'],
  },
  {
    name: 'OnePlus 12',
    slug: 'oneplus-12',
    sku: 'SKU-OP-12-010',
    description: 'Fast performance with OxygenOS',
    categoryId: 1,
    brand: 'OnePlus',
    price: 799,
    stock: 22,
    images: ['https://via.placeholder.com/400x300?text=OnePlus+12'],
    rating: 4.5,
    tags: ['smartphone', 'oneplus', 'fast'],
  },
  {
    name: 'Xiaomi 14 Ultra',
    slug: 'xiaomi-14-ultra',
    sku: 'SKU-XM-14U-011',
    description: 'Excellent camera phone with Snapdragon 8 Gen 3',
    categoryId: 1,
    brand: 'Xiaomi',
    price: 699,
    stock: 28,
    images: ['https://via.placeholder.com/400x300?text=Xiaomi+14'],
    rating: 4.6,
    tags: ['smartphone', 'xiaomi', 'camera'],
  },
  {
    name: 'Nothing Phone 2a',
    slug: 'nothing-phone-2a',
    sku: 'SKU-NOTHING-P2A-012',
    description: 'Unique design with transparent back',
    categoryId: 1,
    brand: 'Nothing',
    price: 499,
    stock: 18,
    images: ['https://via.placeholder.com/400x300?text=Nothing+Phone'],
    rating: 4.3,
    tags: ['smartphone', 'nothing', 'unique'],
  },

  // Tablets
  {
    name: 'iPad Pro 12.9"',
    slug: 'ipad-pro-12-9',
    sku: 'SKU-APPLE-IPADP-013',
    description: 'Premium tablet with M2 chip',
    categoryId: 2,
    brand: 'Apple',
    price: 1099,
    stock: 14,
    images: ['https://via.placeholder.com/400x300?text=iPad+Pro'],
    rating: 4.8,
    tags: ['tablet', 'apple', 'premium'],
  },
  {
    name: 'Samsung Galaxy Tab S9 Ultra',
    slug: 'samsung-galaxy-tab-s9-ultra',
    sku: 'SKU-SAM-GTABS9U-014',
    description: 'Large AMOLED tablet for productivity',
    categoryId: 2,
    brand: 'Samsung',
    price: 1199,
    stock: 12,
    images: ['https://via.placeholder.com/400x300?text=Galaxy+Tab+S9'],
    rating: 4.7,
    tags: ['tablet', 'samsung', 'amoled'],
  },
  {
    name: 'iPad Air',
    slug: 'ipad-air',
    sku: 'SKU-APPLE-IPADA-015',
    description: 'Balanced tablet experience',
    categoryId: 2,
    brand: 'Apple',
    price: 599,
    stock: 20,
    images: ['https://via.placeholder.com/400x300?text=iPad+Air'],
    rating: 4.6,
    tags: ['tablet', 'apple', 'balanced'],
  },
  {
    name: 'Lenovo Tab P12 Pro',
    slug: 'lenovo-tab-p12-pro',
    sku: 'SKU-LENOVO-TP12P-016',
    description: 'Affordable Android tablet',
    categoryId: 2,
    brand: 'Lenovo',
    price: 499,
    stock: 24,
    images: ['https://via.placeholder.com/400x300?text=Lenovo+Tab+P12'],
    rating: 4.4,
    tags: ['tablet', 'lenovo', 'affordable'],
  },
  {
    name: 'Microsoft Surface Go 3',
    slug: 'microsoft-surface-go-3',
    sku: 'SKU-MS-SG3-017',
    description: 'Portable Windows tablet',
    categoryId: 2,
    brand: 'Microsoft',
    price: 399,
    stock: 16,
    images: ['https://via.placeholder.com/400x300?text=Surface+Go+3'],
    rating: 4.2,
    tags: ['tablet', 'microsoft', 'portable'],
  },

  // Headphones
  {
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    sku: 'SKU-SONY-WH1000-018',
    description: 'Noise-canceling headphones with premium sound',
    categoryId: 3,
    brand: 'Sony',
    price: 399,
    stock: 30,
    images: ['https://via.placeholder.com/400x300?text=Sony+WH-1000XM5'],
    rating: 4.9,
    tags: ['headphones', 'sony', 'noise-cancel'],
  },
  {
    name: 'Apple AirPods Pro',
    slug: 'apple-airpods-pro',
    sku: 'SKU-APPLE-APP-019',
    description: 'Wireless earbuds with spatial audio',
    categoryId: 3,
    brand: 'Apple',
    price: 249,
    stock: 35,
    images: ['https://via.placeholder.com/400x300?text=AirPods+Pro'],
    rating: 4.7,
    tags: ['headphones', 'apple', 'wireless'],
  },
  {
    name: 'Bose QuietComfort 45',
    slug: 'bose-quietcomfort-45',
    sku: 'SKU-BOSE-QC45-020',
    description: 'Comfortable noise-canceling headphones',
    categoryId: 3,
    brand: 'Bose',
    price: 379,
    stock: 22,
    images: ['https://via.placeholder.com/400x300?text=Bose+QC45'],
    rating: 4.6,
    tags: ['headphones', 'bose', 'comfortable'],
  },
  {
    name: 'Samsung Galaxy Buds2 Pro',
    slug: 'samsung-galaxy-buds2-pro',
    sku: 'SKU-SAM-GB2P-021',
    description: 'Android-optimized wireless earbuds',
    categoryId: 3,
    brand: 'Samsung',
    price: 229,
    stock: 28,
    images: ['https://via.placeholder.com/400x300?text=Galaxy+Buds2'],
    rating: 4.5,
    tags: ['headphones', 'samsung', 'android'],
  },
  {
    name: 'JBL Tour One',
    slug: 'jbl-tour-one',
    sku: 'SKU-JBL-TO-022',
    description: 'Affordable quality earbuds',
    categoryId: 3,
    brand: 'JBL',
    price: 149,
    stock: 40,
    images: ['https://via.placeholder.com/400x300?text=JBL+Tour+One'],
    rating: 4.3,
    tags: ['headphones', 'jbl', 'affordable'],
  },

  // Smartwatches
  {
    name: 'Apple Watch Series 9',
    slug: 'apple-watch-series-9',
    sku: 'SKU-APPLE-AWS9-023',
    description: 'Advanced health and fitness tracker',
    categoryId: 4,
    brand: 'Apple',
    price: 399,
    stock: 26,
    images: ['https://via.placeholder.com/400x300?text=Apple+Watch+9'],
    rating: 4.8,
    tags: ['smartwatch', 'apple', 'fitness'],
  },
  {
    name: 'Samsung Galaxy Watch 6 Classic',
    slug: 'samsung-galaxy-watch-6-classic',
    sku: 'SKU-SAM-GW6C-024',
    description: 'Classic design smartwatch',
    categoryId: 4,
    brand: 'Samsung',
    price: 299,
    stock: 20,
    images: ['https://via.placeholder.com/400x300?text=Galaxy+Watch+6'],
    rating: 4.6,
    tags: ['smartwatch', 'samsung', 'classic'],
  },
  {
    name: 'Garmin Epix 2',
    slug: 'garmin-epix-2',
    sku: 'SKU-GARMIN-E2-025',
    description: 'Sports and fitness smartwatch',
    categoryId: 4,
    brand: 'Garmin',
    price: 499,
    stock: 15,
    images: ['https://via.placeholder.com/400x300?text=Garmin+Epix+2'],
    rating: 4.7,
    tags: ['smartwatch', 'garmin', 'sports'],
  },
  {
    name: 'Fitbit Sense 2',
    slug: 'fitbit-sense-2',
    sku: 'SKU-FITBIT-S2-026',
    description: 'Health-focused smartwatch',
    categoryId: 4,
    brand: 'Fitbit',
    price: 249,
    stock: 24,
    images: ['https://via.placeholder.com/400x300?text=Fitbit+Sense+2'],
    rating: 4.4,
    tags: ['smartwatch', 'fitbit', 'health'],
  },
  {
    name: 'Amazfit GTR 4',
    slug: 'amazfit-gtr-4',
    sku: 'SKU-AMAZFIT-GTR4-027',
    description: 'Long battery life smartwatch',
    categoryId: 4,
    brand: 'Amazfit',
    price: 179,
    stock: 32,
    images: ['https://via.placeholder.com/400x300?text=Amazfit+GTR+4'],
    rating: 4.5,
    tags: ['smartwatch', 'amazfit', 'battery'],
  },
  {
    name: 'Huawei Watch GT 4',
    slug: 'huawei-watch-gt-4',
    sku: 'SKU-HUAWEI-WGT4-028',
    description: 'Premium wearable with elegant design',
    categoryId: 4,
    brand: 'Huawei',
    price: 299,
    stock: 19,
    images: ['https://via.placeholder.com/400x300?text=Huawei+Watch+GT4'],
    rating: 4.6,
    tags: ['smartwatch', 'huawei', 'elegant'],
  },
  {
    name: 'Realme Watch T1',
    slug: 'realme-watch-t1',
    sku: 'SKU-REALME-WT1-029',
    description: 'Budget-friendly smartwatch',
    categoryId: 4,
    brand: 'Realme',
    price: 99,
    stock: 45,
    images: ['https://via.placeholder.com/400x300?text=Realme+Watch+T1'],
    rating: 4.2,
    tags: ['smartwatch', 'realme', 'budget'],
  },
  {
    name: 'Withings ScanWatch',
    slug: 'withings-scanwatch',
    sku: 'SKU-WITHINGS-SW-030',
    description: 'Medical-grade smartwatch with ECG',
    categoryId: 4,
    brand: 'Withings',
    price: 299,
    stock: 12,
    images: ['https://via.placeholder.com/400x300?text=Withings+ScanWatch'],
    rating: 4.7,
    tags: ['smartwatch', 'withings', 'medical'],
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cd-store';
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('✓ Cleared existing data');

    // Seed categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✓ Created ${createdCategories.length} categories`);

    // Seed users with hashed passwords
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(user.passwordHash, salt);
        return { ...user, passwordHash: hashedPassword };
      })
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✓ Created ${createdUsers.length} users`);

    // Map category names to IDs for products
    const categoryMap = {};
    createdCategories.forEach((cat, index) => {
      categoryMap[index] = cat._id;
    });

    // Update products with correct category IDs
    const productsWithCategoryIds = products.map((product) => ({
      ...product,
      categoryId: categoryMap[product.categoryId],
    }));

    // Seed products
    const createdProducts = await Product.insertMany(productsWithCategoryIds);
    console.log(`✓ Created ${createdProducts.length} products`);

    // Log summary
    console.log('\n========== SEED SUMMARY ==========');
    console.log(`Users: ${createdUsers.length}`);
    createdUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.role})`);
    });
    console.log(`Categories: ${createdCategories.length}`);
    categories.forEach((cat) => {
      const count = productsWithCategoryIds.filter((p) => p.categoryId === categoryMap[categories.indexOf(cat)])
        .length;
      console.log(`  - ${cat.name}: ${count} products`);
    });
    console.log(`Total Products: ${createdProducts.length}`);
    console.log('==================================\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Seed failed:', error.message);
    process.exit(1);
  }
};

seedDatabase();
