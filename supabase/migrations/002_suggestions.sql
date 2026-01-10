-- Suggestions table for AI-generated and user-proposed edits
create type suggestion_status as enum ('pending', 'approved', 'rejected');
create type suggestion_type as enum ('create_person', 'update_person', 'create_relationship', 'create_event', 'extracted_data');

create table suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,

  suggestion_type suggestion_type not null,
  status suggestion_status not null default 'pending',

  -- What this suggestion proposes
  entity_type text,                    -- 'person', 'relationship', 'event'
  entity_id uuid,                      -- If updating existing entity
  proposed_data jsonb not null,        -- The proposed changes

  -- AI context
  source_id uuid references sources(id) on delete set null,
  extracted_from text,                 -- Description of where this was extracted
  confidence numeric,                  -- 0-1 confidence score
  ai_reasoning text,                   -- Why AI made this suggestion

  -- Matching
  matched_person_id uuid references people(id) on delete set null,
  match_confidence numeric,

  -- Review
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_notes text,

  -- Metadata
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index idx_suggestions_workspace on suggestions(workspace_id);
create index idx_suggestions_status on suggestions(status);
create index idx_suggestions_source on suggestions(source_id);

-- RLS
alter table suggestions enable row level security;

create policy "Users can view suggestions in their workspaces"
  on suggestions for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Contributors can create suggestions"
  on suggestions for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can update suggestions"
  on suggestions for update
  using (can_edit_in_workspace(workspace_id));

create policy "Admins can delete suggestions"
  on suggestions for delete
  using (is_admin_in_workspace(workspace_id));
