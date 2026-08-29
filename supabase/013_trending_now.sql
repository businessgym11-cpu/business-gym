-- Business Gym: 지역(대한민국) 기준 유튜브 전체 인기 급상승 영상
-- n8n "Business Gym - Trending Now Collector" 워크플로우가 매일 아침
-- YouTube Data API의 chart=mostPopular(검색어 없이 지역 기준 실시간 인기,
-- videos.list 1 unit — 키워드 기반 search.list 100 unit보다 훨씬 저렴)로
-- 수집해서 이 테이블에 넣는다. surge_videos(구독자 대비 상대적 급상승,
-- 26개 시드 키워드 기반)와는 성격이 다른 별개 신호 — 여긴 절대적 인기,
-- 대형 채널 위주로 나올 수 있음. duration으로 숏츠/롱폼을 나눠서
-- 각각 top10씩 담는다.
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.trending_now (
  id uuid primary key default gen_random_uuid(),
  video_id text not null,
  title text not null,
  description text,
  channel_title text,
  channel_id text,
  thumbnail_url text,
  view_count bigint,
  published_at timestamptz,
  video_url text not null,
  duration_seconds int,
  is_shorts boolean not null,
  rank int,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists trending_now_snapshot_date_idx
  on public.trending_now (snapshot_date);

alter table public.trending_now enable row level security;

create policy "trending_now is publicly readable"
  on public.trending_now for select
  using (true);

-- insert/delete는 n8n의 service_role 키로만 수행 — RLS를 우회하므로
-- 별도 insert/delete 정책은 필요 없다.
