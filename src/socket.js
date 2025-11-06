// src/socket.js
import { io } from 'socket.io-client';

// Use your devtunnel or server base URL here
export const socket = io('https://z2x0r4x7-5000.inc1.devtunnels.ms', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
