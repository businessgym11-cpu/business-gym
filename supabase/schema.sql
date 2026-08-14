-- Business Gym: 파트너 승인 상태 스키마
-- Supabase 프로젝트의 SQL Editor에서 1회 실행하세요.

create type approval_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  approval_status approval_status not null default 'pending',
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 본인 프로필만 조회 가능 (middleware가 approval_status를 읽을 때 사용)
create policy "본인 프로필 조회"
  on public.profiles for select
  using (auth.uid() = id);

-- 회원가입(auth.users insert) 시 profiles 행을 자동 생성 — 기본값은 'pending'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- 수동 승인 (1단계, 지금 여기서부터 시작)
-- 결제 확인 후 Supabase Table Editor에서 해당 유저의
-- approval_status를 'approved'로 직접 변경하면 즉시 게이트가 열립니다.
--
-- update public.profiles set approval_status = 'approved', approved_at = now()
-- where email = 'partner@example.com';
--
-- ─────────────────────────────────────────────
-- 자동 승인 (2단계, 나중에 전환)
-- 결제 PG 완료 웹훅 → n8n → 아래와 동일한 update 쿼리를 Supabase REST/RPC로
-- 호출하도록 워크플로우만 추가하면 됩니다. 프론트/미들웨어 코드는 변경할 필요가 없습니다.
