import express, { Application } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './lib/db.ts';
import authRoutes from './routes/auth.route.ts';
import messageRoutes from './routes/message.route.ts';
import { checkCloudinaryConnection } from './lib/cloudinaryHealth.ts';

dotenv.config();
const app: Application = express();

const PORT = process.env.PORT;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: `http://localhost:5173`,
    credentials: true,
  }),
);
app.use('/api/auth', authRoutes);
app.use('/api/message', messageRoutes);

const startServer = async () => {
  try {
    // Check Cloudinary connection before starting the server
    const cloudinaryStatus = await checkCloudinaryConnection();
    if (!cloudinaryStatus.isConnected) {
      console.error('Failed to connect to Cloudinary. Server startup aborted.');
      process.exit(1);
    }

    // Connect to MongoDB
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Cloudinary connection verified');
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please:
1. Check for other running instances of the application
2. Stop the process using port ${PORT}, or
3. Choose a different port in your environment configuration`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
};

startServer();
