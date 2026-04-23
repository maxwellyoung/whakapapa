-- Security and storage fixes for share links, invites, memberships, and memories

alter table memories add column if not exists media_path text;

create or replace function get_role_rank(role_value user_role)
returns integer
language sql
immutable
as $$
  select case role_value
    when 'owner' then 5
    when 'admin' then 4
    when 'editor' then 3
    when 'contributor' then 2
    when 'viewer' then 1
  end
$$;

drop policy if exists "Admins can manage memberships" on memberships;
drop policy if exists "Admins can update memberships" on memberships;
drop policy if exists "Admins can delete memberships" on memberships;

create or replace function get_invite_by_token(invite_token text)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  inv record;
begin
  select i.*, w.name as workspace_name
  into inv
  from invites i
  join workspaces w on w.id = i.workspace_id
  where i.token = invite_token;

  if inv is null then
    return null;
  end if;

  return jsonb_build_object(
    'workspace_name', inv.workspace_name,
    'role', inv.role,
    'expired', inv.expires_at is not null and inv.expires_at <= now(),
    'used', inv.used_at is not null
  );
end;
$$;

grant execute on function get_invite_by_token(text) to anon;
grant execute on function get_invite_by_token(text) to authenticated;

create or replace function update_membership_role(
  target_membership_id uuid,
  new_role user_role
)
returns jsonb
language plpgsql
security definer
as $$
declare
  actor_record memberships%rowtype;
  target_record memberships%rowtype;
  actor_rank integer;
  target_rank integer;
  new_rank integer;
begin
  select *
  into target_record
  from memberships
  where id = target_membership_id;

  if target_record.id is null then
    return jsonb_build_object('success', false, 'error', 'Member not found');
  end if;

  select *
  into actor_record
  from memberships
  where workspace_id = target_record.workspace_id
    and user_id = auth.uid();

  if actor_record.id is null or actor_record.role not in ('owner', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  if target_record.user_id = auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Cannot change your own role');
  end if;

  if target_record.role = 'owner' or new_role = 'owner' then
    return jsonb_build_object('success', false, 'error', 'Owner role cannot be changed here');
  end if;

  actor_rank := get_role_rank(actor_record.role);
  target_rank := get_role_rank(target_record.role);
  new_rank := get_role_rank(new_role);

  if actor_rank <= target_rank or actor_rank <= new_rank then
    return jsonb_build_object('success', false, 'error', 'Cannot assign a role equal to or higher than your own');
  end if;

  update memberships
  set role = new_role
  where id = target_membership_id;

  return jsonb_build_object('success', true);
end;
$$;

create or replace function remove_workspace_member(target_membership_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  actor_record memberships%rowtype;
  target_record memberships%rowtype;
  actor_rank integer;
  target_rank integer;
begin
  select *
  into target_record
  from memberships
  where id = target_membership_id;

  if target_record.id is null then
    return jsonb_build_object('success', false, 'error', 'Member not found');
  end if;

  select *
  into actor_record
  from memberships
  where workspace_id = target_record.workspace_id
    and user_id = auth.uid();

  if actor_record.id is null or actor_record.role not in ('owner', 'admin') then
    return jsonb_build_object('success', false, 'error', 'Not authorized');
  end if;

  if target_record.user_id = auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Cannot remove yourself');
  end if;

  if target_record.role = 'owner' then
    return jsonb_build_object('success', false, 'error', 'Owner cannot be removed');
  end if;

  actor_rank := get_role_rank(actor_record.role);
  target_rank := get_role_rank(target_record.role);

  if actor_rank <= target_rank then
    return jsonb_build_object('success', false, 'error', 'Cannot remove a member with equal or higher access');
  end if;

  delete from memberships
  where id = target_membership_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function update_membership_role(uuid, user_role) to authenticated;
grant execute on function remove_workspace_member(uuid) to authenticated;

create or replace function resolve_share_access(
  link_token text,
  provided_password text default null,
  password_verified boolean default false,
  increment_view boolean default true
)
returns jsonb
language plpgsql
security definer
as $$
declare
  link_row shareable_links%rowtype;
  workspace_name text;
  memory_row record;
  person_row record;
  updated_count integer;
begin
  select sl.*
  into link_row
  from shareable_links sl
  where sl.token = link_token;

  if link_row.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  select w.name
  into workspace_name
  from workspaces w
  where w.id = link_row.workspace_id;

  if link_row.expires_at is not null and link_row.expires_at <= now() then
    return jsonb_build_object('status', 'expired');
  end if;

  if link_row.max_views is not null and link_row.view_count >= link_row.max_views then
    return jsonb_build_object('status', 'max_views_reached');
  end if;

  if link_row.password_hash is not null and not password_verified then
    if provided_password is null or length(trim(provided_password)) = 0 then
      return jsonb_build_object('status', 'password_required');
    end if;

    if crypt(provided_password, link_row.password_hash) <> link_row.password_hash then
      return jsonb_build_object('status', 'invalid_password');
    end if;
  end if;

  if link_row.entity_type = 'memory' then
    select
      m.id,
      m.memory_type,
      m.title,
      m.content,
      m.media_url,
      m.media_path,
      m.media_type,
      m.duration_seconds,
      m.contributed_by_name,
      m.created_at,
      p.id as person_id,
      p.preferred_name,
      p.photo_url,
      p.given_names,
      p.family_name
    into memory_row
    from memories m
    join people p on p.id = m.person_id
    where m.id = link_row.entity_id
      and m.workspace_id = link_row.workspace_id;

    if memory_row.id is null then
      return jsonb_build_object('status', 'not_found');
    end if;
  elsif link_row.entity_type = 'person' then
    select
      p.id,
      p.preferred_name,
      p.given_names,
      p.family_name,
      p.photo_url,
      p.bio,
      p.birth_date,
      p.death_date
    into person_row
    from people p
    where p.id = link_row.entity_id
      and p.workspace_id = link_row.workspace_id;

    if person_row.id is null then
      return jsonb_build_object('status', 'not_found');
    end if;
  else
    return jsonb_build_object('status', 'not_found');
  end if;

  if increment_view then
    update shareable_links
    set view_count = view_count + 1
    where id = link_row.id
      and (expires_at is null or expires_at > now())
      and (max_views is null or view_count < max_views);

    get diagnostics updated_count = row_count;

    if updated_count = 0 then
      return jsonb_build_object('status', 'max_views_reached');
    end if;
  end if;

  if link_row.entity_type = 'memory' then
    return jsonb_build_object(
      'status', 'ok',
      'entity_type', 'memory',
      'workspace', jsonb_build_object('name', workspace_name),
      'memory', jsonb_build_object(
        'id', memory_row.id,
        'memory_type', memory_row.memory_type,
        'title', memory_row.title,
        'content', memory_row.content,
        'media_url', memory_row.media_url,
        'media_path', memory_row.media_path,
        'media_type', memory_row.media_type,
        'duration_seconds', memory_row.duration_seconds,
        'contributed_by_name', memory_row.contributed_by_name,
        'created_at', memory_row.created_at
      ),
      'person', jsonb_build_object(
        'id', memory_row.person_id,
        'preferred_name', memory_row.preferred_name,
        'photo_url', memory_row.photo_url,
        'given_names', memory_row.given_names,
        'family_name', memory_row.family_name
      )
    );
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'entity_type', 'person',
    'workspace', jsonb_build_object('name', workspace_name),
    'person', jsonb_build_object(
      'id', person_row.id,
      'preferred_name', person_row.preferred_name,
      'given_names', person_row.given_names,
      'family_name', person_row.family_name,
      'photo_url', person_row.photo_url,
      'bio', person_row.bio,
      'birth_date', person_row.birth_date,
      'death_date', person_row.death_date
    )
  );
end;
$$;
