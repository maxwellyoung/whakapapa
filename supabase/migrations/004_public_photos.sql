-- Allow public read access to photos in the sources bucket
-- This enables profile photos to be displayed without authentication

create policy "Public can view photos"
on storage.objects for select
to public
using (
  bucket_id = 'sources'
  and (storage.foldername(name))[2] = 'photos'
);
