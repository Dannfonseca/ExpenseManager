import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    logger.logEvent('INFO', 'Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.logEvent('INFO', `MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.logEvent('ERROR', `MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
