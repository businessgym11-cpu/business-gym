-- Business Gym: Step2 씬 이미지 업로드용 Storage 버킷
-- Supabase SQL Editor에서 1회 실행하세요.

insert into storage.buckets (id, name, public)
values ('scene-uploads', 'scene-uploads', true)
on conflict (id) do nothing;

-- 로그인한 사용자는 자기 uid로 시작하는 폴더에만 업로드 가능
create policy "본인 폴더에만 업로드 가능"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'scene-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인이 올린 파일만 삭제 가능
create policy "본인 파일만 삭제 가능"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'scene-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 버킷이 public이라 읽기는 /storage/v1/object/public/... 경로로 RLS 없이 열람 가능
