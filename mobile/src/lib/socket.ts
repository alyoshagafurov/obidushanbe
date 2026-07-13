/**
 * Подключение к WebSocket (Socket.IO) с JWT-токеном.
 * Реалтайм: новые/взятые заказы у доставщиков, обновления статусов, чат.
 */
import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { tokenStore } from './secureStore';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  const token = await tokenStore.getAccess();
  if (!token) return null;

  if (socket?.connected) return socket;
  socket?.disconnect();

  socket = io(config.wsUrl, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1500,
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
