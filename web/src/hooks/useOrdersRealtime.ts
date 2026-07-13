import { useEffect } from 'react';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { SocketEvent } from '@obi/shared';
import { connectSocket } from '../lib/socket';

/** Инвалидация запросов React Query при реалтайм-событиях заказов. */
export function useOrdersRealtime(keys: QueryKey[]) {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    const invalidate = () => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    socket.on(SocketEvent.ORDER_NEW, invalidate);
    socket.on(SocketEvent.ORDER_TAKEN, invalidate);
    socket.on(SocketEvent.ORDER_UPDATED, invalidate);
    return () => {
      socket.off(SocketEvent.ORDER_NEW, invalidate);
      socket.off(SocketEvent.ORDER_TAKEN, invalidate);
      socket.off(SocketEvent.ORDER_UPDATED, invalidate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
