-- Business Gym: 트렌드 분석(1단계, 유튜브 전용) 데이터 테이블
-- n8n "Business Gym - Trend Collector (YouTube)" 워크플로우가 매일 이 테이블에
-- service_role 키로 insert하고, 프론트는 anon 키로 읽기만 한다.
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.trend_snapshots (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'youtube',
  keyword text not null,
  video_id text not null,
  title text not null,
  channel_title text,
  thumbnail_url text,
  view_count bigint,
  published_at timestamptz,
  video_url text not null,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists trend_snapshots_snapshot_date_idx
  on public.trend_snapshots (snapshot_date);
create index if not exists trend_snapshots_keyword_idx
  on public.trend_snapshots (keyword);

alter table public.trend_snapshots enable row level security;

create policy "trend_snapshots are publicly readable"
  on public.trend_snapshots for select
  using (true);

-- insert/delete는 n8n의 service_role 키로만 수행 — RLS를 우회하므로
-- 별도 insert/delete 정책은 필요 없다.
