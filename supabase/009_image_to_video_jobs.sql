-- Business Gym: 이미지+프롬프트 → 영상 변환 작업 상태 테이블
-- n8n "Business Gym - Image To Video" 워크플로우가 이 테이블에 pending 행을
-- 만들고 jobId를 즉시 응답한 뒤(Respond to Webhook), 백그라운드에서
-- Fal.ai LTX-Video(image-to-video)를 호출해 완료 시 done/error로 업데이트한다
-- — render_jobs와 동일한 비동기/폴링 패턴 (Vercel 504 게이트웨이 타임아웃이
-- 영상 생성 시간보다 짧아서 응답을 기다리는 단일 요청/응답 구조로는 못 버팀).
-- Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.image_to_video_jobs (
  id uuid primary key,
  status text not null default 'pending',
  video_url text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists image_to_video_jobs_created_at_idx
  on public.image_to_video_jobs (created_at);

alter table public.image_to_video_jobs enable row level security;

create policy "image_to_video_jobs are publicly readable"
  on public.image_to_video_jobs for select
  using (true);

-- insert/update는 n8n의 service_role 키로만 수행 — RLS를 우회하므로
-- 별도 insert/update 정책은 필요 없다.
