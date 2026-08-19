-- Business Gym: 트렌드 수집 키워드(카테고리) 관리 테이블
-- n8n "Business Gym - Trend Collector (YouTube)" 워크플로우가 매일 이 테이블에서
-- is_active=true 인 키워드만 읽어서 수집한다. 관리자(/admin/trend-keywords)에서
-- 추가/삭제/활성화 토글 가능.
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.trend_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.trend_keywords enable row level security;

create policy "trend_keywords are publicly readable"
  on public.trend_keywords for select
  using (true);

-- insert/update/delete는 관리자 Server Action(service_role)으로만 수행 —
-- RLS를 우회하므로 별도 정책은 필요 없다.

insert into public.trend_keywords (keyword) values
  ('사주풀이'),
  ('운세'),
  ('타로'),
  ('궁합'),
  ('신점'),
  ('재테크'),
  ('부업'),
  ('자기계발')
on conflict (keyword) do nothing;
