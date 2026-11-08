-- Waypoint · skema Supabase v1
-- Jalankan sekali di Supabase → SQL Editor, di project StudyO (sama dengan Synthesis).
-- Aman dijalankan ulang. Tidak menyentuh tabel StudyO maupun tabel peta_* milik Synthesis.
--
-- Struktur roadmap (fase, topik, langkah, sumber) ada di kode: src/data/roadmap.ts.
-- Database hanya menyimpan langkah mana yang sudah selesai: satu baris = satu langkah selesai.

create table if not exists public.waypoint_progress (
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  step_id  text not null check (step_id ~ '^[a-z0-9-]{1,80}$'),
  done_at  timestamptz not null default now(),
  primary key (user_id, step_id)
);

alter table public.waypoint_progress enable row level security;

-- Setiap akun hanya bisa melihat, menambah, dan menghapus progresnya sendiri.
drop policy if exists waypoint_progress_select on public.waypoint_progress;
create policy waypoint_progress_select on public.waypoint_progress
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists waypoint_progress_insert on public.waypoint_progress;
create policy waypoint_progress_insert on public.waypoint_progress
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists waypoint_progress_delete on public.waypoint_progress;
create policy waypoint_progress_delete on public.waypoint_progress
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.waypoint_progress from anon;
grant select, insert, delete on public.waypoint_progress to authenticated;
