import mongoose from 'mongoose';
import Order from './src/models/Order.js';

(async () => {
  try {
    const uri = 'mongodb://worklequocanh_db_user:12345@ac-7fpbniv-shard-00-00.dhoy5hp.mongodb.net:27017,ac-7fpbniv-shard-00-01.dhoy5hp.mongodb.net:27017,ac-7fpbniv-shard-00-02.dhoy5hp.mongodb.net:27017/cd-store?ssl=true&authSource=admin&replicaSet=atlas-fee3v0-shard-0';
    await mongoose.connect(uri);

    const agg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    console.log(agg);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
