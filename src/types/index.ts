// Core database types

export type UserRole = 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer'
export type DatePrecision = 'exact' | 'year' | 'month' | 'circa' | 'range' | 'unknown'
export type RelationshipType =
  | 'parent_child'
  | 'spouse'
  | 'sibling'
  | 'adoptive_parent'
  | 'step_parent'
  | 'foster_parent'
  | 'guardian'
  | 'partner'
  | 'other'
export type EventType =
  | 'birth'
  | 'death'
  | 'marriage'
  | 'divorce'
  | 'baptism'
  | 'graduation'
  | 'immigration'
  | 'emigration'
  | 'military_service'
  | 'occupation'
  | 'residence'
  | 'census'
  | 'burial'
  | 'other'
export type SourceType = 'document' | 'photo' | 'url' | 'audio' | 'video' | 'note'
export type VisibilityLevel = 'public' | 'restricted' | 'private'

// Flexible date handling
export interface FlexibleDate {
  date: string | null
  precision: DatePrecision
  endDate?: string | null
}

// Database row types
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  created_at: string
  created_by: string | null
}

export interface Membership {
  id: string
  workspace_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface Group {
  id: string
  workspace_id: string
  name: string
  description: string | null
  created_at: string
}

export interface GroupMember {
  group_id: string
  user_id: string
  created_at: string
}

export interface Invite {
  id: string
  workspace_id: string
  token: string
  role: UserRole
  groups: string[]
  expires_at: string | null
  used_at: string | null
  used_by: string | null
  created_by: string | null
  created_at: string
}

export interface Person {
  id: string
  workspace_id: string
  preferred_name: string
  given_names: string | null
  family_name: string | null
  alternate_names: string[]
  birth_date: string | null
  birth_date_precision: DatePrecision
  birth_date_end: string | null
  birth_place: string | null
  death_date: string | null
  death_date_precision: DatePrecision
  death_date_end: string | null
  death_place: string | null
  gender: string | null
  bio: string | null
  photo_url: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

export interface Relationship {
  id: string
  workspace_id: string
  person_a_id: string
  person_b_id: string
  relationship_type: RelationshipType
  start_date: string | null
  end_date: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}

export interface Event {
  id: string
  workspace_id: string
  event_type: EventType
  title: string | null
  description: string | null
  event_date: string | null
  event_date_precision: DatePrecision
  event_date_end: string | null
  location: string | null
  created_at: string
  created_by: string | null
}

export interface EventParticipant {
  event_id: string
  person_id: string
  role: string | null
}

export interface Source {
  id: string
  workspace_id: string
  source_type: SourceType
  title: string
  description: string | null
  file_path: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  url: string | null
  content: string | null
  extracted_text: string | null
  source_date: string | null
  repository: string | null
  created_at: string
  created_by: string | null
}

export interface Citation {
  id: string
  source_id: string
  entity_type: string
  entity_id: string
  field: string | null
  excerpt: string | null
  page_number: string | null
  confidence: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}

export interface EntityVisibility {
  id: string
  workspace_id: string
  entity_type: string
  entity_id: string
  visibility: VisibilityLevel
  group_ids: string[]
  user_ids: string[]
}

export interface ActivityLog {
  id: string
  workspace_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  created_at: string
}

// Extended types with relations
export interface MembershipWithProfile extends Membership {
  profiles: Profile | null
}

export interface MembershipWithWorkspace extends Membership {
  workspaces: Workspace
}

export interface PersonWithRelationships extends Person {
  relationships_as_a: Relationship[]
  relationships_as_b: Relationship[]
}

// Form types
export interface PersonFormData {
  preferred_name: string
  given_names?: string
  family_name?: string
  alternate_names?: string[]
  birth_date?: string
  birth_date_precision?: DatePrecision
  birth_date_end?: string
  birth_place?: string
  death_date?: string
  death_date_precision?: DatePrecision
  death_date_end?: string
  death_place?: string
  gender?: string
  bio?: string
}

export interface WorkspaceFormData {
  name: string
  slug: string
}

// Utility types
export type WithTimestamps<T> = T & {
  created_at: string
  updated_at?: string
}
