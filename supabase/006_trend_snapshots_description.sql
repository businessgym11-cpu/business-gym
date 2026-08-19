-- Business Gym: 트렌드 벤치마킹 분석용 영상 설명(description) 컬럼 추가
-- n8n "Business Gym - Trend Benchmark Analysis" 워크플로우가 Gemini 분석 시
-- 제목뿐 아니라 설명(주로 해시태그/후킹 문구 포함)도 함께 참고하도록 함.
-- Supabase SQL Editor에서 1회 실행하세요.

alter table public.trend_snapshots add column if not exists description text;
