/** WebSocket-подключение (тот же сервер, что и у приложения). */
import { io, Socket } from 'socket.io-client';
import { config } from '../config';
import { tokenStore } from './storage';

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  const token = tokenStore.getAccess();
  if (!token) return null;
  if (socket?.connected) return socket;
  socket?.disconnect();
  socket = io(config.wsUrl, { transports: ['websocket'], auth: { token }, reconnection: true });
  return socket;
}

export const getSocket = () => socket;
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
