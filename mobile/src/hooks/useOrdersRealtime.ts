/**
 * Подписка на реалтайм-события заказов. При событии инвалидируем релевантные
 * запросы React Query, чтобы списки обновлялись мгновенно.
 *
 * onOrderNew/onOrderTaken — опциональные колбэки (нужны ленте доставщика).
 */
import { useEffect } from 'react';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { OrderDto, OrderTakenPayload, SocketEvent } from '@obi/shared';
import { connectSocket, getSocket } from '../lib/socket';

interface Options {
  queryKeysToInvalidate?: QueryKey[];
  onOrderNew?: (order: OrderDto) => void;
  onOrderTaken?: (payload: OrderTakenPayload) => void;
}

export function useOrdersRealtime({ queryKeysToInvalidate = [], onOrderNew, onOrderTaken }: Options = {}) {
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;

    (async () => {
      const socket = (await connectSocket()) ?? getSocket();
      if (!socket || !active) return;

      const invalidateAll = () => queryKeysToInvalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));

      const handleNew = (order: OrderDto) => {
        onOrderNew?.(order);
        invalidateAll();
      };
      const handleTaken = (payload: OrderTakenPayload) => {
        onOrderTaken?.(payload);
        invalidateAll();
      };
      const handleUpdated = () => invalidateAll();

      socket.on(SocketEvent.ORDER_NEW, handleNew);
      socket.on(SocketEvent.ORDER_TAKEN, handleTaken);
      socket.on(SocketEvent.ORDER_UPDATED, handleUpdated);

      // Очистка
      return () => {
        socket.off(SocketEvent.ORDER_NEW, handleNew);
        socket.off(SocketEvent.ORDER_TAKEN, handleTaken);
        socket.off(SocketEvent.ORDER_UPDATED, handleUpdated);
      };
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
