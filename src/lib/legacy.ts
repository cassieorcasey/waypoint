import { LEGACY_ORDER } from '../data/roadmap';
import { safeStorage } from './hooks';

// Roadmap HTML lama menyimpan centang di localStorage "roadmap_progress_v2" sebagai {c1: true, c7: true, ...},
// dengan c1..cN mengikuti urutan langkah. Dua jalur impor:
// 1. Otomatis, kalau roadmap lama pernah dibuka di domain yang sama (cassieorcasey.github.io).
// 2. Lewat link: .../waypoint/#impor=1.7.12 (nomor checkbox lama).
const OLD_KEY = 'roadmap_progress_v2';
const FLAG = 'waypoint_legacy_handled';

const fromIndexes = (nums: number[]) =>
  [...new Set(nums.filter(n => Number.isInteger(n) && n >= 1 && n <= LEGACY_ORDER.length).map(n => LEGACY_ORDER[n - 1]))];

export function findLegacy(): string[] {
  const hash = location.hash.match(/impor=([\d.]+)/);
  if (hash) return fromIndexes(hash[1].split('.').map(Number));
  if (safeStorage.get(FLAG)) return [];
  try {
    const old = JSON.parse(safeStorage.get(OLD_KEY) || '{}') as Record<string, boolean>;
    return fromIndexes(Object.keys(old).filter(k => old[k]).map(k => Number(k.slice(1))));
  } catch { return []; }
}

export function markLegacyHandled() {
  safeStorage.set(FLAG, '1');
  if (location.hash.includes('impor=')) history.replaceState(null, '', location.pathname + location.search);
}
