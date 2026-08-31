'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRealtimeSubscription } from '@/lib/realtime/useRealtimeSubscription';

export function eventsKey() {
  return ['events'];
}

async function fetchEvents() {
  const res = await fetch('/api/events');
  if (!res.ok) throw new Error('Gagal memuat data acara');
  return res.json();
}

export function useEventsQuery() {
  const queryClient = useQueryClient();

  const result = useQuery({
    queryKey: eventsKey(),
    queryFn: fetchEvents,
    refetchInterval: 15_000,
  });

  useRealtimeSubscription(
    'events',
    useCallback(
      (payload) => {
        queryClient.setQueryData(eventsKey(), (old) => {
          if (!old) return old;
          switch (payload.eventType) {
            case 'INSERT':
              return [payload.new, ...old];
            case 'UPDATE':
              return old.map((e) => (e.id === payload.new.id ? { ...e, ...payload.new } : e));
            case 'DELETE':
              return old.filter((e) => e.id !== payload.old.id);
            default:
              return old;
          }
        });
      },
      [queryClient]
    )
  );

  return result;
}

export function useEventMutations() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async ({ event, idempotencyKey }) => {
      const headers = { 'Content-Type': 'application/json' };
      if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
      const res = await fetch('/api/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || 'Gagal membuat acara');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsKey() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, idempotencyKey, ...updates }) => {
      const headers = { 'Content-Type': 'application/json' };
      if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error((data && data.error) || 'Gagal mengupdate acara');
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(eventsKey(), (old) => {
        if (!old) return old;
        return old.map((e) => (e.id === data.id ? { ...e, ...data } : e));
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, idempotencyKey }) => {
      const headers = {};
      if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Gagal menghapus acara');
      return true;
    },
    onSuccess: (_data, { id }) => {
      queryClient.setQueryData(eventsKey(), (old) => {
        if (!old) return old;
        return old.filter((e) => e.id !== id);
      });
    },
  });

  const addEvent = async (event, idempotencyKey) => {
    return await addMutation.mutateAsync({ event, idempotencyKey });
  };

  const updateEvent = async (id, updates, idempotencyKey) => {
    return await updateMutation.mutateAsync({ id, idempotencyKey, ...updates });
  };

  const deleteEvent = async (id, idempotencyKey) => {
    await deleteMutation.mutateAsync({ id, idempotencyKey });
    return true;
  };

  return {
    addEvent,
    updateEvent,
    deleteEvent,
    addMutation,
    updateMutation,
    deleteMutation,
  };
}
