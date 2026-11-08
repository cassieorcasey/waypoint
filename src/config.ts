// Project Supabase StudyO, sama dengan Synthesis.
// Publishable/anon key aman ada di kode publik selama RLS aktif (lihat schema.sql).
export const SUPABASE_URL = 'https://mzeovinagkjvoocbeytj.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_jyOphMfcx8BlRhiER8ZRxg_n52XQZgV';

/** ?demo di URL: data contoh, progres hanya di browser ini, tanpa login. */
export const DEMO = new URLSearchParams(location.search).has('demo');
