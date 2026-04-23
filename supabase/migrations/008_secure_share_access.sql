-- Secure public share access resolver with optional password verification

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
    select
      m.id,
      m.memory_type,
      m.title,
      m.content,
      m.media_url,
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
  end if;

  return jsonb_build_object('status', 'not_found');
end;
$$;

grant execute on function resolve_share_access(text, text, boolean, boolean) to anon;
grant execute on function resolve_share_access(text, text, boolean, boolean) to authenticated;
