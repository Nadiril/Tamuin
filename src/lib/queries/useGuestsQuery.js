'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRealtimeSubscription } from '@/lib/realtime/useRealtimeSubscription';

export function guestsKey(filters = {}) {
  return ['guests', filters];
}

async function fetchGuests(filters = {}) {
  const params = new URLSearchParams();
  if (filters.acara_id) {
    params.append('acara_id', filters.acara_id);
  }
  const url = `/api/guests${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat data tamu');
  return res.json();
}

async function readError(res, fallback) {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export function useGuestsQuery(filters = {}) {
  const queryClient = useQueryClient();
  const { acara_id } = filters;

  const result = useQuery({
    queryKey: guestsKey(filters),
    queryFn: () => fetchGuests(filters),
    refetchInterval: 15_000,
  });

  const filter = acara_id ? { filter: `acara_id=eq.${acara_id}` } : null;

  useRealtimeSubscription(
    'guests',
    useCallback(
      (payload) => {
        queryClient.setQueryData(guestsKey({ acara_id }), (old) => {
          if (!old) return old;
          switch (payload.eventType) {
            case 'INSERT':
              return [payload.new, ...old];
            case 'UPDATE':
              return old.map((g) => (g.id === payload.new.id ? { ...g, ...payload.new } : g));
            case 'DELETE':
              return old.filter((g) => g.id !== payload.old.id);
            default:
              return old;
          }
        });
      },
      [queryClient, acara_id]
    ),
    filter,
    [JSON.stringify(filter)]
  );

  return result;
}

export function useGuestMutations() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async ({ guest, idempotencyKey }) => {
      const headers = { 'Content-Type': 'application/json' };
      if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers,
        body: JSON.stringify(guest),
      });
      if (!res.ok) throw new Error(await readError(res, 'Gagal menambah tamu'));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestsKey() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, idempotencyKey, ...updates }) => {
      const headers = { 'Content-Type': 'application/json' };
      if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
      const res = await fetch(`/api/guests/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(await readError(res, 'Gagal mengupdate tamu'));
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(guestsKey(), (old) => {
        if (!old) return old;
        return old.map((g) => (g.id === data.id ? { ...g, ...data } : g));
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, idempotencyKey }) => {
      const headers = {};
      if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
      const res = await fetch(`/api/guests/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Gagal menghapus tamu');
      return true;
    },
    onSuccess: (_data, { id }) => {
      queryClient.setQueryData(guestsKey(), (old) => {
        if (!old) return old;
        return old.filter((g) => g.id !== id);
      });
    },
  });

  const addGuest = async (guest, idempotencyKey) => {
    const data = await addMutation.mutateAsync({ guest, idempotencyKey });
    return data;
  };

  const updateGuest = async (id, updates, idempotencyKey) => {
    const data = await updateMutation.mutateAsync({ id, idempotencyKey, ...updates });
    return data;
  };

  const deleteGuest = async (id, idempotencyKey) => {
    await deleteMutation.mutateAsync({ id, idempotencyKey });
    return true;
  };

  return {
    addGuest,
    updateGuest,
    deleteGuest,
    addMutation,
    updateMutation,
    deleteMutation,
  };
}
