import mongoose from 'mongoose';
import User from '../models/user.model';
import { connectDB } from '../lib/db';
import dotenv from 'dotenv';

dotenv.config();

const cleanupDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const cleanupResult = await User.collection.updateMany(
      {},
      { $unset: { profilPic: '' } },
    );

    console.log(`Documents processed: ${cleanupResult.modifiedCount}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during database cleanup:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

cleanupDatabase();
