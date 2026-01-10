-- Create sources bucket
insert into storage.buckets (id, name, public)
values ('sources', 'sources', false)
on conflict (id) do nothing;

-- Policy: Users can upload to their workspace folder
create policy "Users can upload sources"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'sources'
  and (storage.foldername(name))[1] in (
    select id::text from workspaces
    where id in (select get_user_workspaces())
  )
);

-- Policy: Users can view sources in their workspaces
create policy "Users can view sources"
on storage.objects for select
to authenticated
using (
  bucket_id = 'sources'
  and (storage.foldername(name))[1] in (
    select id::text from workspaces
    where id in (select get_user_workspaces())
  )
);

-- Policy: Users can update sources in their workspaces (editors+)
create policy "Editors can update sources"
on storage.objects for update
to authenticated
using (
  bucket_id = 'sources'
  and (storage.foldername(name))[1] in (
    select id::text from workspaces w
    where can_edit_in_workspace(w.id)
  )
);

-- Policy: Admins can delete sources
create policy "Admins can delete sources"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'sources'
  and (storage.foldername(name))[1] in (
    select id::text from workspaces w
    where is_admin_in_workspace(w.id)
  )
);
