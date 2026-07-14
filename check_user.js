import mongoose from 'mongoose';
import User from './src/models/User.js';

(async () => {
  try {
    const uri = 'mongodb://worklequocanh_db_user:12345@ac-7fpbniv-shard-00-00.dhoy5hp.mongodb.net:27017,ac-7fpbniv-shard-00-01.dhoy5hp.mongodb.net:27017,ac-7fpbniv-shard-00-02.dhoy5hp.mongodb.net:27017/cd-store?ssl=true&authSource=admin&replicaSet=atlas-fee3v0-shard-0';
    await mongoose.connect(uri);
    
    const user = await User.findOne({ email: 'anhlq1208@gmail.com' });
    console.log(user);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
