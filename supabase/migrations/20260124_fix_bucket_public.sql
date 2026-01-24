-- Force the avatars bucket to be public
update storage.buckets
set public = true
where id = 'avatars';

-- Re-assert policies just in case
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );
