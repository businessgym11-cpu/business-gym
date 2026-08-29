-- Business Gym: 채널 리서치 4단계 — 마음에 드는 영상을 폴더별로 저장해두는 기능.
-- researched_channel_videos에서 값을 그대로 복사해서 저장하는 구조라(비정규화),
-- 나중에 원본 채널을 최신화하거나 삭제해도 저장한 영상 정보는 그대로 남는다.
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.research_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.research_folders(id) on delete set null,
  youtube_video_id text not null,
  title text not null,
  thumbnail_url text,
  channel_title text,
  view_count bigint,
  published_at timestamptz,
  contribution_tier text,
  performance_tier text,
  created_at timestamptz not null default now(),
  unique (user_id, youtube_video_id)
);

create index if not exists saved_videos_folder_id_idx
  on public.saved_videos (folder_id);

alter table public.research_folders enable row level security;
alter table public.saved_videos enable row level security;

create policy "본인 폴더만 조회 가능"
  on public.research_folders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 폴더만 생성 가능"
  on public.research_folders for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "본인 폴더만 삭제 가능"
  on public.research_folders for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 저장 영상만 조회 가능"
  on public.saved_videos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 저장 영상만 생성 가능"
  on public.saved_videos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "본인 저장 영상만 수정 가능"
  on public.saved_videos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "본인 저장 영상만 삭제 가능"
  on public.saved_videos for delete
  to authenticated
  using (auth.uid() = user_id);
