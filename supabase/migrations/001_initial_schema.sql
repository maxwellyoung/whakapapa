-- Whakapapa Database Schema
-- Initial migration with all tables, types, RLS policies, and triggers

-- ============================================
-- CUSTOM TYPES
-- ============================================

create type user_role as enum ('owner', 'admin', 'editor', 'contributor', 'viewer');
create type date_precision as enum ('exact', 'year', 'month', 'circa', 'range', 'unknown');
create type relationship_type as enum (
  'parent_child',
  'spouse',
  'sibling',
  'adoptive_parent',
  'step_parent',
  'foster_parent',
  'guardian',
  'partner',
  'other'
);
create type event_type as enum (
  'birth', 'death', 'marriage', 'divorce', 'baptism', 'graduation',
  'immigration', 'emigration', 'military_service', 'occupation',
  'residence', 'census', 'burial', 'other'
);
create type source_type as enum ('document', 'photo', 'url', 'audio', 'video', 'note');
create type visibility_level as enum ('public', 'restricted', 'private');

-- ============================================
-- CORE TABLES
-- ============================================

-- Workspaces
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Memberships (user <-> workspace with role)
create table memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role user_role not null default 'viewer',
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- Groups (for branch-based visibility)
create table groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Group members
create table group_members (
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (group_id, user_id)
);

-- Invite tokens
create table invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  token text unique not null,
  role user_role not null default 'viewer',
  groups uuid[] default '{}',
  expires_at timestamptz,
  used_at timestamptz,
  used_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- People
create table people (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,

  -- Names
  preferred_name text not null,
  given_names text,
  family_name text,
  alternate_names text[] default '{}',

  -- Birth dates (flexible)
  birth_date date,
  birth_date_precision date_precision default 'unknown',
  birth_date_end date,
  birth_place text,

  -- Death dates (flexible)
  death_date date,
  death_date_precision date_precision default 'unknown',
  death_date_end date,
  death_place text,

  -- Other
  gender text,
  bio text,
  photo_url text,

  -- Metadata
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Relationships
create table relationships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  person_a_id uuid references people(id) on delete cascade not null,
  person_b_id uuid references people(id) on delete cascade not null,
  relationship_type relationship_type not null,

  start_date date,
  end_date date,
  notes text,

  created_at timestamptz default now(),
  created_by uuid references auth.users(id),

  unique(workspace_id, person_a_id, person_b_id, relationship_type)
);

-- Events
create table events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  event_type event_type not null,
  title text,
  description text,

  event_date date,
  event_date_precision date_precision default 'unknown',
  event_date_end date,
  location text,

  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Event participants (many-to-many)
create table event_participants (
  event_id uuid references events(id) on delete cascade not null,
  person_id uuid references people(id) on delete cascade not null,
  role text,
  primary key (event_id, person_id)
);

-- Sources
create table sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  source_type source_type not null,

  title text not null,
  description text,

  -- For files
  file_path text,
  file_name text,
  file_size bigint,
  mime_type text,

  -- For URLs
  url text,

  -- For notes/transcriptions
  content text,

  -- OCR/AI extracted text
  extracted_text text,

  -- Metadata
  source_date date,
  repository text,

  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Citations
create table citations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade not null,

  entity_type text not null,
  entity_id uuid not null,
  field text,

  excerpt text,
  page_number text,
  confidence text,
  notes text,

  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Entity visibility
create table entity_visibility (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,

  entity_type text not null,
  entity_id uuid not null,

  visibility visibility_level not null default 'public',
  group_ids uuid[] default '{}',
  user_ids uuid[] default '{}',

  unique(entity_type, entity_id)
);

-- Activity log
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id),

  action text not null,
  entity_type text not null,
  entity_id uuid not null,

  before_data jsonb,
  after_data jsonb,

  created_at timestamptz default now()
);

-- User profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_memberships_workspace on memberships(workspace_id);
create index idx_memberships_user on memberships(user_id);
create index idx_groups_workspace on groups(workspace_id);
create index idx_people_workspace on people(workspace_id);
create index idx_relationships_workspace on relationships(workspace_id);
create index idx_relationships_person_a on relationships(person_a_id);
create index idx_relationships_person_b on relationships(person_b_id);
create index idx_events_workspace on events(workspace_id);
create index idx_sources_workspace on sources(workspace_id);
create index idx_citations_source on citations(source_id);
create index idx_citations_entity on citations(entity_type, entity_id);
create index idx_entity_visibility on entity_visibility(entity_type, entity_id);
create index idx_activity_log_workspace on activity_log(workspace_id);
create index idx_activity_log_entity on activity_log(entity_type, entity_id);
create index idx_invites_token on invites(token);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's workspace memberships
create or replace function get_user_workspaces()
returns setof uuid
language sql
security definer
stable
as $$
  select workspace_id from memberships where user_id = auth.uid()
$$;

-- Get user's role in a workspace
create or replace function get_user_role(ws_id uuid)
returns user_role
language sql
security definer
stable
as $$
  select role from memberships
  where workspace_id = ws_id and user_id = auth.uid()
$$;

-- Get user's groups in a workspace
create or replace function get_user_groups(ws_id uuid)
returns uuid[]
language sql
security definer
stable
as $$
  select coalesce(array_agg(g.id), '{}')
  from groups g
  join group_members gm on gm.group_id = g.id
  where g.workspace_id = ws_id and gm.user_id = auth.uid()
$$;

-- Check if user can view an entity
create or replace function can_view_entity(
  ws_id uuid,
  ent_type text,
  ent_id uuid
)
returns boolean
language sql
security definer
stable
as $$
  select case
    when not exists (
      select 1 from entity_visibility
      where entity_type = ent_type and entity_id = ent_id
    ) then true
    else exists (
      select 1 from entity_visibility ev
      where ev.entity_type = ent_type
        and ev.entity_id = ent_id
        and (
          ev.visibility = 'public'
          or (ev.visibility = 'restricted'
              and ev.group_ids && get_user_groups(ws_id))
          or (ev.visibility = 'private'
              and auth.uid() = any(ev.user_ids))
        )
    )
  end
$$;

-- Check if user can edit in workspace
create or replace function can_edit_in_workspace(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from memberships
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'editor')
  )
$$;

-- Check if user can contribute in workspace
create or replace function can_contribute_in_workspace(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from memberships
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin', 'editor', 'contributor')
  )
$$;

-- Check if user is admin in workspace
create or replace function is_admin_in_workspace(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from memberships
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  )
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table workspaces enable row level security;
alter table memberships enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table invites enable row level security;
alter table people enable row level security;
alter table relationships enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table sources enable row level security;
alter table citations enable row level security;
alter table entity_visibility enable row level security;
alter table activity_log enable row level security;
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on profiles for select
  using (true);

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Workspaces policies
create policy "Users can view their workspaces"
  on workspaces for select
  using (id in (select get_user_workspaces()));

create policy "Authenticated users can create workspaces"
  on workspaces for insert
  with check (auth.uid() is not null);

create policy "Admins can update workspaces"
  on workspaces for update
  using (is_admin_in_workspace(id));

create policy "Owners can delete workspaces"
  on workspaces for delete
  using (get_user_role(id) = 'owner');

-- Memberships policies
create policy "Users can view memberships in their workspaces"
  on memberships for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Admins can manage memberships"
  on memberships for insert
  with check (is_admin_in_workspace(workspace_id));

create policy "Admins can update memberships"
  on memberships for update
  using (is_admin_in_workspace(workspace_id));

create policy "Admins can delete memberships"
  on memberships for delete
  using (is_admin_in_workspace(workspace_id));

-- Groups policies
create policy "Users can view groups in their workspaces"
  on groups for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Admins can manage groups"
  on groups for all
  using (is_admin_in_workspace(workspace_id));

-- Group members policies
create policy "Users can view group members"
  on group_members for select
  using (
    group_id in (
      select id from groups where workspace_id in (select get_user_workspaces())
    )
  );

create policy "Admins can manage group members"
  on group_members for all
  using (
    group_id in (
      select id from groups where is_admin_in_workspace(workspace_id)
    )
  );

-- Invites policies
create policy "Users can view invites in their workspaces"
  on invites for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Admins can create invites"
  on invites for insert
  with check (is_admin_in_workspace(workspace_id));

create policy "Admins can delete invites"
  on invites for delete
  using (is_admin_in_workspace(workspace_id));

-- Allow anyone to view invites by token (for redemption)
create policy "Anyone can view invite by token"
  on invites for select
  using (token = current_setting('app.current_invite_token', true));

-- People policies
create policy "Users can view people they have access to"
  on people for select
  using (
    workspace_id in (select get_user_workspaces())
    and can_view_entity(workspace_id, 'person', id)
  );

create policy "Contributors can create people"
  on people for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can update people"
  on people for update
  using (
    can_edit_in_workspace(workspace_id)
    and can_view_entity(workspace_id, 'person', id)
  );

create policy "Admins can delete people"
  on people for delete
  using (is_admin_in_workspace(workspace_id));

-- Relationships policies
create policy "Users can view relationships they have access to"
  on relationships for select
  using (
    workspace_id in (select get_user_workspaces())
    and can_view_entity(workspace_id, 'relationship', id)
  );

create policy "Contributors can create relationships"
  on relationships for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can update relationships"
  on relationships for update
  using (can_edit_in_workspace(workspace_id));

create policy "Admins can delete relationships"
  on relationships for delete
  using (is_admin_in_workspace(workspace_id));

-- Events policies
create policy "Users can view events they have access to"
  on events for select
  using (
    workspace_id in (select get_user_workspaces())
    and can_view_entity(workspace_id, 'event', id)
  );

create policy "Contributors can create events"
  on events for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can update events"
  on events for update
  using (can_edit_in_workspace(workspace_id));

create policy "Admins can delete events"
  on events for delete
  using (is_admin_in_workspace(workspace_id));

-- Event participants policies
create policy "Users can view event participants"
  on event_participants for select
  using (
    event_id in (
      select id from events where workspace_id in (select get_user_workspaces())
    )
  );

create policy "Contributors can manage event participants"
  on event_participants for all
  using (
    event_id in (
      select id from events where can_contribute_in_workspace(workspace_id)
    )
  );

-- Sources policies
create policy "Users can view sources they have access to"
  on sources for select
  using (
    workspace_id in (select get_user_workspaces())
    and can_view_entity(workspace_id, 'source', id)
  );

create policy "Contributors can create sources"
  on sources for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can update sources"
  on sources for update
  using (can_edit_in_workspace(workspace_id));

create policy "Admins can delete sources"
  on sources for delete
  using (is_admin_in_workspace(workspace_id));

-- Citations policies
create policy "Users can view citations"
  on citations for select
  using (
    source_id in (
      select id from sources where workspace_id in (select get_user_workspaces())
    )
  );

create policy "Contributors can create citations"
  on citations for insert
  with check (
    source_id in (
      select id from sources where can_contribute_in_workspace(workspace_id)
    )
  );

create policy "Editors can update citations"
  on citations for update
  using (
    source_id in (
      select id from sources where can_edit_in_workspace(workspace_id)
    )
  );

create policy "Admins can delete citations"
  on citations for delete
  using (
    source_id in (
      select id from sources where is_admin_in_workspace(workspace_id)
    )
  );

-- Entity visibility policies
create policy "Users can view entity visibility in their workspaces"
  on entity_visibility for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Editors can manage entity visibility"
  on entity_visibility for all
  using (can_edit_in_workspace(workspace_id));

-- Activity log policies
create policy "Users can view activity in their workspaces"
  on activity_log for select
  using (workspace_id in (select get_user_workspaces()));

create policy "System can insert activity logs"
  on activity_log for insert
  with check (workspace_id in (select get_user_workspaces()));

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger people_updated_at
  before update on people
  for each row execute function update_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Activity logging trigger
create or replace function log_activity()
returns trigger
language plpgsql
security definer
as $$
declare
  ws_id uuid;
begin
  -- Get workspace_id from the record
  if TG_OP = 'DELETE' then
    ws_id := OLD.workspace_id;
  else
    ws_id := NEW.workspace_id;
  end if;

  if TG_OP = 'INSERT' then
    insert into activity_log (workspace_id, user_id, action, entity_type, entity_id, after_data)
    values (ws_id, auth.uid(), 'create', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
  elsif TG_OP = 'UPDATE' then
    insert into activity_log (workspace_id, user_id, action, entity_type, entity_id, before_data, after_data)
    values (ws_id, auth.uid(), 'update', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
  elsif TG_OP = 'DELETE' then
    insert into activity_log (workspace_id, user_id, action, entity_type, entity_id, before_data)
    values (ws_id, auth.uid(), 'delete', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
  end if;

  return coalesce(NEW, OLD);
end;
$$;

-- Apply activity logging to entity tables
create trigger people_audit
  after insert or update or delete on people
  for each row execute function log_activity();

create trigger relationships_audit
  after insert or update or delete on relationships
  for each row execute function log_activity();

create trigger events_audit
  after insert or update or delete on events
  for each row execute function log_activity();

create trigger sources_audit
  after insert or update or delete on sources
  for each row execute function log_activity();

-- Create profile on user signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  return NEW;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Function to create workspace with owner membership
create or replace function create_workspace_with_owner(
  workspace_name text,
  workspace_slug text
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_workspace_id uuid;
begin
  -- Create workspace
  insert into workspaces (name, slug, created_by)
  values (workspace_name, workspace_slug, auth.uid())
  returning id into new_workspace_id;

  -- Add creator as owner
  insert into memberships (workspace_id, user_id, role)
  values (new_workspace_id, auth.uid(), 'owner');

  return new_workspace_id;
end;
$$;

-- Function to redeem invite
create or replace function redeem_invite(invite_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  inv record;
  result jsonb;
begin
  -- Find and validate invite
  select * into inv from invites
  where token = invite_token
    and used_at is null
    and (expires_at is null or expires_at > now());

  if inv is null then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  end if;

  -- Check if already a member
  if exists (
    select 1 from memberships
    where workspace_id = inv.workspace_id and user_id = auth.uid()
  ) then
    return jsonb_build_object('success', false, 'error', 'Already a member');
  end if;

  -- Create membership
  insert into memberships (workspace_id, user_id, role)
  values (inv.workspace_id, auth.uid(), inv.role);

  -- Add to groups if specified
  if array_length(inv.groups, 1) > 0 then
    insert into group_members (group_id, user_id)
    select unnest(inv.groups), auth.uid();
  end if;

  -- Mark invite as used
  update invites
  set used_at = now(), used_by = auth.uid()
  where id = inv.id;

  return jsonb_build_object(
    'success', true,
    'workspace_id', inv.workspace_id
  );
end;
$$;

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Note: Run this in Supabase dashboard or via API
-- insert into storage.buckets (id, name, public)
-- values ('sources', 'sources', false);
