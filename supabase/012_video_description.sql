-- Business Gym: 영상 상세 패널에서 설명을 보여주기 위해 채널 분석 쪽
-- 영상 테이블에도 description을 저장하도록 컬럼 추가.
-- Supabase SQL Editor에서 1회 실행하세요.

alter table public.researched_channel_videos
  add column if not exists description text;
