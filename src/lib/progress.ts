import { useCallback, useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { LEGACY_ORDER } from '../data/roadmap';
import { safeStorage } from './hooks';

const TABLE = 'waypoint_progress';
const DEMO_KEY = 'waypoint_demo_progress';
const VALID = new Set(LEGACY_ORDER);

const readDemo = (): string[] => {
  try { return (JSON.parse(safeStorage.get(DEMO_KEY) || '[]') as string[]).filter(id => VALID.has(id)); }
  catch { return []; }
};

/**
 * Progres per langkah. Demo: localStorage. Live: tabel waypoint_progress (satu baris = satu langkah selesai).
 * Perubahan langsung tampil (optimistic) lalu dikembalikan kalau Supabase menolak.
 */
export function useProgress(client: SupabaseClient | null, userId: string | null) {
  const [done, setDone] = useState<Set<string>>(() => new Set(client ? [] : readDemo()));
  const [ready, setReady] = useState(!client);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(0);

  const load = useCallback(async () => {
    if (!client || !userId || pending.current > 0) return;
    const { data, error } = await client.from(TABLE).select('step_id');
    if (pending.current > 0) return; // ada simpanan yang sedang jalan; jangan timpa
    if (error) { setError('Progres tidak bisa dimuat. Periksa koneksi lalu muat ulang.'); return; }
    setDone(new Set((data as { step_id: string }[]).map(r => r.step_id).filter(id => VALID.has(id))));
    setReady(true);
  }, [client, userId]);

  // Sinkron antarperangkat: muat ulang setiap kali tab kembali aktif.
  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [load]);

  useEffect(() => { if (!client) safeStorage.set(DEMO_KEY, JSON.stringify([...done])); }, [client, done]);

  const apply = (ids: string[], value: boolean) =>
    setDone(prev => {
      const next = new Set(prev);
      for (const id of ids) value ? next.add(id) : next.delete(id);
      return next;
    });

  const setSteps = useCallback(async (ids: string[], value: boolean) => {
    ids = ids.filter(id => VALID.has(id));
    if (!ids.length) return;
    apply(ids, value);
    if (!client) return;
    pending.current++;
    const res = value
      ? await client.from(TABLE).upsert(ids.map(step_id => ({ step_id })), { onConflict: 'user_id,step_id', ignoreDuplicates: true })
      : await client.from(TABLE).delete().in('step_id', ids);
    pending.current--;
    if (res.error) {
      apply(ids, !value);
      setError('Gagal menyimpan. Periksa koneksi lalu coba lagi.');
    }
  }, [client]);

  const clearError = useCallback(() => setError(null), []);
  return { done, ready, error, clearError, setSteps };
}
