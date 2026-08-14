-- Business Gym: 관리자 승인형 회원가입 스키마
-- schema.sql을 먼저 실행한 프로젝트에서, 추가로 1회 실행하세요.

create extension if not exists pgcrypto;

-- profiles에 신청서 정보(이름/전화번호/아이디)를 담을 컬럼 추가
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists username text unique;

create type signup_request_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  username text not null,
  status signup_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.signup_requests enable row level security;

-- 회원가입 폼에서 로그인하지 않은 방문자가 신청서를 등록할 수 있도록 허용.
-- status는 반드시 'pending'으로만 넣을 수 있음. 조회/승인/거절은 전부
-- 서비스 역할 키(관리자 서버 코드, lib/supabase/admin.ts)로만 가능하고
-- 이 정책에는 select/update가 없으므로 일반 사용자는 목록을 볼 수 없다.
create policy "누구나 가입 신청 가능"
  on public.signup_requests for insert
  to anon
  with check (status = 'pending');

-- ─────────────────────────────────────────────
-- 승인 플로우 (app/admin/actions.ts approveSignupRequest)
-- 1) admin.auth.admin.inviteUserByEmail(email, ...)로 계정 생성 + 초대 메일 발송
--    (신청서의 full_name/phone/username을 user_metadata로 같이 넘김)
-- 2) profiles.full_name/phone/username/approval_status='approved' 갱신
-- 3) signup_requests.status='approved'로 갱신
--
-- 신청자는 메일의 링크를 눌러 /auth/set-password에서 본인이 직접
-- 비밀번호를 설정한 뒤, /login에서 이메일+비밀번호로 로그인한다.
