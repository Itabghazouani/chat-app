import express, { Application } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { connectDB } from './lib/db.ts';
import authRoutes from './routes/auth.route.ts';
import messageRoutes from './routes/message.route.ts';
import { checkCloudinaryConnection } from './lib/cloudinaryHealth.ts';
import { app, server } from './lib/socket.ts';
import path from 'path';

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

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
app.use('/api/messages', messageRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html')),
  );
}
const startServer = async () => {
  try {
    const cloudinaryStatus = await checkCloudinaryConnection();
    if (!cloudinaryStatus.isConnected) {
      console.error('Failed to connect to Cloudinary. Server startup aborted.');
      process.exit(1);
    }

    await connectDB();

    server.listen(PORT, () => {
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
