-- Migration: Memories, Stories, Interview Prompts, Photo Tagging
-- For preserving family stories and oral history

-- ============================================
-- MEMORIES / STORIES
-- ============================================

-- Memories table - stories, anecdotes, personality traits
create table memories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  person_id uuid references people(id) on delete cascade not null,

  -- Content
  title text,
  content text not null,
  memory_type text default 'story', -- story, anecdote, quote, trait, recipe, tradition

  -- Media attachments (audio/video recordings)
  media_url text,
  media_type text, -- audio, video
  duration_seconds integer,

  -- Attribution
  contributed_by_name text, -- "Aunt Mary", "Dad"
  contributed_by_user_id uuid references auth.users(id),
  recorded_date date,

  -- Metadata
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

create index idx_memories_workspace on memories(workspace_id);
create index idx_memories_person on memories(person_id);

-- RLS policies for memories
alter table memories enable row level security;

create policy "Users can view memories in their workspaces"
  on memories for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Contributors can create memories"
  on memories for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can update memories"
  on memories for update
  using (can_edit_in_workspace(workspace_id));

create policy "Admins can delete memories"
  on memories for delete
  using (is_admin_in_workspace(workspace_id));

-- Trigger for updated_at
create trigger memories_updated_at
  before update on memories
  for each row execute function update_updated_at();

-- ============================================
-- INTERVIEW PROMPTS
-- ============================================

-- Pre-defined interview questions to ask family members
create table interview_prompts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,

  -- Content
  question text not null,
  category text not null, -- childhood, family, career, memories, traditions, advice
  description text,

  -- Ordering
  sort_order integer default 0,

  -- System vs custom
  is_system boolean default false,

  created_at timestamptz default now()
);

-- Default system prompts (workspace_id null = available to all)
insert into interview_prompts (question, category, description, is_system, sort_order) values
  -- Childhood
  ('What is your earliest memory?', 'childhood', 'Often reveals formative experiences', true, 1),
  ('What was your childhood home like?', 'childhood', 'Physical space and feeling of home', true, 2),
  ('What games did you play as a child?', 'childhood', 'Recreation and friendships', true, 3),
  ('What was school like for you?', 'childhood', 'Education and social experiences', true, 4),
  ('What were your parents like?', 'childhood', 'Relationship with parents', true, 5),

  -- Family
  ('How did you meet your spouse/partner?', 'family', 'Love story', true, 10),
  ('What was your wedding day like?', 'family', 'Marriage celebration', true, 11),
  ('What do you remember about the day each child was born?', 'family', 'Becoming a parent', true, 12),
  ('What family traditions did you grow up with?', 'family', 'Cultural heritage', true, 13),
  ('What is your favourite family recipe?', 'family', 'Food and gathering', true, 14),

  -- Career & Life
  ('What was your first job?', 'career', 'Work beginnings', true, 20),
  ('What are you most proud of in your career?', 'career', 'Professional achievements', true, 21),
  ('What was the hardest decision you ever made?', 'career', 'Life challenges', true, 22),
  ('Where have you lived and why did you move?', 'career', 'Life journey', true, 23),

  -- Memories
  ('What historical events do you remember living through?', 'memories', 'Historical witness', true, 30),
  ('Who was your best friend growing up?', 'memories', 'Childhood friendships', true, 31),
  ('What do you miss most about the old days?', 'memories', 'Nostalgia and change', true, 32),
  ('What was the happiest day of your life?', 'memories', 'Joy and celebration', true, 33),

  -- Traditions & Beliefs
  ('What holidays were most important to your family?', 'traditions', 'Celebrations', true, 40),
  ('What values did your parents teach you?', 'traditions', 'Family values', true, 41),
  ('What do you believe happens after we die?', 'traditions', 'Spiritual beliefs', true, 42),

  -- Advice & Legacy
  ('What advice would you give to younger generations?', 'advice', 'Wisdom to pass on', true, 50),
  ('What do you want people to remember about you?', 'advice', 'Legacy', true, 51),
  ('Is there anything you wish you had done differently?', 'advice', 'Reflections', true, 52),
  ('What makes a good life?', 'advice', 'Philosophy', true, 53);

create index idx_interview_prompts_workspace on interview_prompts(workspace_id);
create index idx_interview_prompts_category on interview_prompts(category);

-- Interview responses
create table interview_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  prompt_id uuid references interview_prompts(id) on delete set null,
  person_id uuid references people(id) on delete cascade not null,

  -- The question (copied in case prompt is deleted)
  question text not null,

  -- Response
  response text,

  -- Audio/video recording
  recording_url text,
  recording_type text, -- audio, video
  duration_seconds integer,
  transcription text,

  -- Who answered
  answered_by_name text, -- "Grandpa", "Mum"
  answered_date date,

  -- Status
  status text default 'pending', -- pending, recorded, transcribed

  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

create index idx_interview_responses_workspace on interview_responses(workspace_id);
create index idx_interview_responses_person on interview_responses(person_id);
create index idx_interview_responses_prompt on interview_responses(prompt_id);

-- RLS for interview tables
alter table interview_prompts enable row level security;
alter table interview_responses enable row level security;

create policy "Users can view system prompts"
  on interview_prompts for select
  using (is_system = true or workspace_id in (select get_user_workspaces()));

create policy "Editors can manage custom prompts"
  on interview_prompts for all
  using (workspace_id in (select get_user_workspaces()) and can_edit_in_workspace(workspace_id));

create policy "Users can view responses in their workspaces"
  on interview_responses for select
  using (workspace_id in (select get_user_workspaces()));

create policy "Contributors can create responses"
  on interview_responses for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can update responses"
  on interview_responses for update
  using (can_edit_in_workspace(workspace_id));

create policy "Admins can delete responses"
  on interview_responses for delete
  using (is_admin_in_workspace(workspace_id));

-- ============================================
-- PHOTO TAGGING
-- ============================================

-- Photo tags - identify people in photos
create table photo_tags (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade not null,
  person_id uuid references people(id) on delete cascade,

  -- Position in image (percentage from top-left)
  x_position numeric, -- 0-100
  y_position numeric, -- 0-100
  width numeric, -- percentage of image width
  height numeric, -- percentage of image height

  -- For unknown people
  unknown_label text, -- "Unknown woman, possibly aunt"

  -- Confidence
  is_confirmed boolean default false,
  suggested_by text, -- 'user' or 'ai'

  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create index idx_photo_tags_source on photo_tags(source_id);
create index idx_photo_tags_person on photo_tags(person_id);

alter table photo_tags enable row level security;

create policy "Users can view photo tags"
  on photo_tags for select
  using (
    source_id in (
      select id from sources where workspace_id in (select get_user_workspaces())
    )
  );

create policy "Contributors can create photo tags"
  on photo_tags for insert
  with check (
    source_id in (
      select id from sources where can_contribute_in_workspace(workspace_id)
    )
  );

create policy "Editors can update photo tags"
  on photo_tags for update
  using (
    source_id in (
      select id from sources where can_edit_in_workspace(workspace_id)
    )
  );

create policy "Admins can delete photo tags"
  on photo_tags for delete
  using (
    source_id in (
      select id from sources where is_admin_in_workspace(workspace_id)
    )
  );

-- ============================================
-- MEMORIAL PAGES
-- ============================================

-- Add memorial fields to people table
alter table people add column if not exists is_memorial boolean default false;
alter table people add column if not exists memorial_message text;
alter table people add column if not exists memorial_created_at timestamptz;

-- Memorial tributes from family members
create table memorial_tributes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  person_id uuid references people(id) on delete cascade not null,

  -- Content
  message text not null,

  -- Attribution
  author_name text not null,
  author_relation text, -- "Granddaughter", "Nephew"
  author_user_id uuid references auth.users(id),

  -- Optional photo with tribute
  photo_url text,

  -- Approval
  is_approved boolean default true,

  created_at timestamptz default now()
);

create index idx_memorial_tributes_person on memorial_tributes(person_id);

alter table memorial_tributes enable row level security;

create policy "Users can view approved tributes"
  on memorial_tributes for select
  using (
    workspace_id in (select get_user_workspaces())
    and is_approved = true
  );

create policy "Contributors can create tributes"
  on memorial_tributes for insert
  with check (can_contribute_in_workspace(workspace_id));

create policy "Editors can manage tributes"
  on memorial_tributes for update
  using (can_edit_in_workspace(workspace_id));

create policy "Admins can delete tributes"
  on memorial_tributes for delete
  using (is_admin_in_workspace(workspace_id));

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Note: Run these in Supabase dashboard:
-- insert into storage.buckets (id, name, public) values ('memories', 'memories', false);
-- insert into storage.buckets (id, name, public) values ('recordings', 'recordings', false);
