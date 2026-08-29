-- Business Gym: surge_videos에 숏츠/롱폼 구분을 위한 컬럼 추가.
-- 기존엔 검색 자체를 videoDuration=short로 제한해서 숏츠만 모았는데,
-- YouTube 검색 API의 "short"는 60초가 아니라 4분 미만을 뜻해서 우리 앱
-- 전역 기준(<=60초)과 어긋날 수 있었음. 이제 제한 없이 검색한 뒤
-- 실제 영상 길이(contentDetails.duration)로 직접 숏츠/롱폼을 나눈다.
-- Supabase SQL Editor에서 1회 실행하세요.

alter table public.surge_videos
  add column if not exists duration_seconds int,
  add column if not exists is_shorts boolean not null default true;
