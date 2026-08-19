-- Business Gym: 장르 무관 급상승 쇼츠 TOP10 데이터 테이블
-- n8n "Business Gym - Surge Videos Collector" 워크플로우가 매일 이 테이블에
-- service_role 키로 insert하고, 프론트는 anon 키로 읽기만 한다.
-- trend_snapshots(사주 관련 8개 키워드 큐레이션)와는 완전히 별개 —
-- 이 테이블은 장르 무관 넓은 키워드로 "조회수/경과일/구독자수" 기준
-- 상대적 급상승 점수(surge_score)가 높은 영상만 담는다.
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.surge_videos (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  keyword text,
  title text not null,
  description text,
  channel_title text,
  channel_id text,
  subscriber_count bigint,
  thumbnail_url text,
  view_count bigint,
  published_at timestamptz,
  video_url text not null,
  surge_score numeric,
  rank int,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists surge_videos_snapshot_date_idx
  on public.surge_videos (snapshot_date);

alter table public.surge_videos enable row level security;

create policy "surge_videos are publicly readable"
  on public.surge_videos for select
  using (true);

-- insert/delete는 n8n의 service_role 키로만 수행 — RLS를 우회하므로
-- 별도 insert/delete 정책은 필요 없다.
