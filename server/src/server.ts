import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { RoomManager } from './rooms/RoomManager.js';
import { registerSocketHandlers } from './socket/socketHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();
registerSocketHandlers(io, roomManager);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'FrostMate Royale Server', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`==========================================`);
  console.log(`  FrostMate Royale Server Running on Port ${PORT}`);
  console.log(`==========================================`);
});
