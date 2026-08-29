-- Business Gym: 채널 리서치 — 사용자가 등록해둔 유튜브 채널과 그 채널의
-- 전체 영상 히스토리를 저장. "최신화" 버튼을 누를 때마다 n8n이 유튜브
-- 데이터를 다시 긁어와 researched_channels 요약 행을 갱신하고,
-- researched_channel_videos는 기존 행을 전부 지우고 새로 채워 넣는
-- snapshot-replace 방식(surge_videos와 동일한 패턴).
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.researched_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  youtube_channel_id text not null,
  title text not null,
  handle text,
  thumbnail_url text,
  subscriber_count bigint,
  total_video_count int,
  channel_created_at timestamptz,
  cumulative_views bigint,
  avg_likes numeric,
  avg_views numeric,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, youtube_channel_id)
);

create table if not exists public.researched_channel_videos (
  id uuid primary key default gen_random_uuid(),
  channel_row_id uuid not null references public.researched_channels(id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  thumbnail_url text,
  duration_seconds int,
  is_shorts boolean not null default false,
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  published_at timestamptz,
  contribution_tier text,
  performance_tier text,
  created_at timestamptz not null default now()
);

create index if not exists researched_channel_videos_channel_row_id_idx
  on public.researched_channel_videos (channel_row_id);

alter table public.researched_channels enable row level security;
alter table public.researched_channel_videos enable row level security;

create policy "본인 등록 채널만 조회 가능"
  on public.researched_channels for select
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 등록 채널만 생성 가능"
  on public.researched_channels for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "본인 등록 채널만 수정 가능"
  on public.researched_channels for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "본인 등록 채널만 삭제 가능"
  on public.researched_channels for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 채널의 영상만 조회 가능"
  on public.researched_channel_videos for select
  to authenticated
  using (
    exists (
      select 1 from public.researched_channels c
      where c.id = channel_row_id and c.user_id = auth.uid()
    )
  );

create policy "본인 채널의 영상만 생성 가능"
  on public.researched_channel_videos for insert
  to authenticated
  with check (
    exists (
      select 1 from public.researched_channels c
      where c.id = channel_row_id and c.user_id = auth.uid()
    )
  );

create policy "본인 채널의 영상만 삭제 가능"
  on public.researched_channel_videos for delete
  to authenticated
  using (
    exists (
      select 1 from public.researched_channels c
      where c.id = channel_row_id and c.user_id = auth.uid()
    )
  );
