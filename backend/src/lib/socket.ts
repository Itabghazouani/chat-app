import { Server, Socket } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173'],
  },
});

export const getReceiverSocketId = (userId: string): string | undefined => {
  return userSocketMap.get(userId);
};

const userSocketMap = new Map<string, string>();

io.on('connection', (socket: Socket) => {
  console.log('A user connected', socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && typeof userId === 'string') {
    userSocketMap.set(userId, socket.id);

    io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));

    console.log('Current online users:', Array.from(userSocketMap.keys()));
  }

  socket.on('disconnect', () => {
    console.log('A user disconnected', socket.id);

    for (const [key, value] of userSocketMap.entries()) {
      if (value === socket.id) {
        userSocketMap.delete(key);
        break;
      }
    }

    io.emit('getOnlineUsers', Array.from(userSocketMap.keys()));

    console.log('Users after disconnect:', Array.from(userSocketMap.keys()));
  });
});

export { io, app, server };
