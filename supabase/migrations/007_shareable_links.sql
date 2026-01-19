-- Migration: Shareable Links for Stories and Memories
-- Allows generating public links to share specific memories with non-members

-- Create shareable_links table
create table shareable_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,

  -- What is being shared
  entity_type text not null, -- 'memory', 'person', 'story'
  entity_id uuid not null,

  -- Link token (URL-safe random string)
  token text unique not null default replace(gen_random_uuid()::text, '-', ''),

  -- Optional settings
  expires_at timestamptz,
  password_hash text, -- For password-protected links
  view_count integer default 0,
  max_views integer, -- null = unlimited

  -- Metadata
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),

  -- Constraints
  constraint valid_entity_type check (entity_type in ('memory', 'person'))
);

-- Index for fast token lookups
create unique index idx_shareable_links_token on shareable_links(token);
create index idx_shareable_links_entity on shareable_links(entity_type, entity_id);

-- RLS policies
alter table shareable_links enable row level security;

-- Only workspace members can create/view their own shareable links
create policy "Users can view shareable links in their workspaces"
  on shareable_links for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Editors can create shareable links"
  on shareable_links for insert
  with check (can_edit_in_workspace(workspace_id));

create policy "Creators can update their shareable links"
  on shareable_links for update
  using (created_by = auth.uid() or is_admin_in_workspace(workspace_id));

create policy "Creators can delete their shareable links"
  on shareable_links for delete
  using (created_by = auth.uid() or is_admin_in_workspace(workspace_id));

-- Function to increment view count (called from public access)
create or replace function increment_share_view(link_token text)
returns void
language plpgsql
security definer
as $$
begin
  update shareable_links
  set view_count = view_count + 1
  where token = link_token
    and (expires_at is null or expires_at > now())
    and (max_views is null or view_count < max_views);
end;
$$;

-- Grant execute to anon for public viewing
grant execute on function increment_share_view(text) to anon;
