'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function resetDataKey() {
  return ['admin', 'reset-data'];
}

async function fetchResetData() {
  const res = await fetch('/api/admin/reset-data');
  if (!res.ok) throw new Error('Gagal memuat jumlah data');
  const data = await res.json();
  return data.counts || { guests: 0, events: 0, activities: 0 };
}

export function useResetDataQuery() {
  return useQuery({
    queryKey: resetDataKey(),
    queryFn: fetchResetData,
  });
}

export function useResetDataMutation() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/reset-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Gagal menghapus data');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: resetDataKey() });
    },
  });

  const deleteData = async () => {
    await deleteMutation.mutateAsync();
  };

  return { deleteData, deleteMutation };
}