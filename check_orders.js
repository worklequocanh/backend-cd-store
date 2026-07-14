import mongoose from 'mongoose';
import Order from './src/models/Order.js';

(async () => {
  try {
    const uri = 'mongodb://worklequocanh_db_user:12345@ac-7fpbniv-shard-00-00.dhoy5hp.mongodb.net:27017,ac-7fpbniv-shard-00-01.dhoy5hp.mongodb.net:27017,ac-7fpbniv-shard-00-02.dhoy5hp.mongodb.net:27017/cd-store?ssl=true&authSource=admin&replicaSet=atlas-fee3v0-shard-0';
    await mongoose.connect(uri);
    console.log('Connected successfully!');
    
    const orders = await Order.find().select('orderNumber total orderStatus paymentStatus');
    console.log(`Found ${orders.length} orders`);
    console.log(orders);
    
    const aggregated = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    console.log('Aggregated Revenue:', aggregated);

    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
})();
