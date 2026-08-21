-- Business Gym: 고객이 업로드한 캐릭터(앞/옆/뒤 참조 이미지) 저장
-- /create Step2에서 "이 캐릭터 사용" 토글을 켜면 씬 이미지 생성 시
-- 이 캐릭터의 앞모습 이미지를 Fal.ai 참조 이미지로 넘겨서 일관된 캐릭터로 생성함.
-- 사용자 1명당 캐릭터 1개(재업로드 시 교체) — Supabase SQL Editor에서 1회 실행하세요.

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  name text,
  front_image_url text not null,
  side_image_url text,
  back_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.characters enable row level security;

create policy "본인 캐릭터만 조회 가능"
  on public.characters for select
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 캐릭터만 생성 가능"
  on public.characters for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "본인 캐릭터만 수정 가능"
  on public.characters for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "본인 캐릭터만 삭제 가능"
  on public.characters for delete
  to authenticated
  using (auth.uid() = user_id);

-- 캐릭터 이미지 업로드용 Storage 버킷 (scene-uploads와 동일한 패턴)
insert into storage.buckets (id, name, public)
values ('character-uploads', 'character-uploads', true)
on conflict (id) do nothing;

create policy "본인 폴더에만 캐릭터 업로드 가능"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'character-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "본인 캐릭터 파일만 삭제 가능"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'character-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
