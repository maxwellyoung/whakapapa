# CLAUDE.md - AI Assistant Guide for Whakapapa

## Project Overview

**Whakapapa** is an AI-powered family knowledge base application for genealogical research. The name comes from the Māori word for genealogy/ancestry. It enables frictionless document ingestion with AI-powered extraction of people, events, and relationships from text sources.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Runtime | React 19.2.3, TypeScript 5 |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth (Magic Link/OTP) |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| UI | Shadcn/UI + Radix UI + Tailwind CSS 4 |
| Animation | Framer Motion 12 |
| Storage | Supabase Storage |

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes (login, invite)
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── people/          # People CRUD + relationships
│   │   ├── sources/         # Document management
│   │   ├── suggestions/     # AI suggestion review
│   │   ├── tree/            # Family tree visualization
│   │   ├── activity/        # Activity log
│   │   ├── settings/        # Workspace settings
│   │   └── export/          # Data export
│   ├── api/                 # API route handlers
│   │   ├── extract/         # Claude AI extraction
│   │   └── ingest/          # Pattern-based extraction
│   └── auth/callback/       # Supabase auth callback
├── components/
│   ├── ui/                  # Shadcn UI components (50+)
│   ├── people/              # Person-related components
│   ├── capture/             # AI capture (QuickCapture)
│   ├── sources/             # Source/document components
│   ├── layout/              # Layout components
│   ├── onboarding/          # Workspace setup
│   └── providers/           # Context providers
├── lib/
│   ├── supabase/            # Supabase clients (client.ts, server.ts)
│   ├── permissions.ts       # Role-based access control
│   ├── duplicate-detection.ts # Name matching algorithms
│   ├── dates.ts             # Date parsing utilities
│   └── utils.ts             # Utility functions (cn)
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript definitions
└── middleware.ts            # Auth middleware

supabase/
├── migrations/              # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_suggestions.sql
│   └── 003_storage.sql
├── config.toml              # Local dev config
└── seed.sql                 # Seed data
```

## Development Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key

# Optional
ANTHROPIC_API_KEY=             # Claude API key (falls back to regex extraction)
NEXT_PUBLIC_APP_URL=           # Base URL for auth redirects
```

## Key Conventions

### File Organization
- **Server Components** are default; use `'use client'` directive for client components
- **API routes** use Next.js Route Handlers in `app/api/`
- **Types** are centralized in `src/types/index.ts`
- **Utilities** go in `src/lib/` with logical subdirectories

### Component Patterns
```tsx
// Props interface above component
interface MyComponentProps {
  value: string;
  onChange?: (value: string) => void;
}

// Functional component with hooks
export function MyComponent({ value, onChange }: MyComponentProps) {
  // Implementation
}
```

### Styling
- Use `cn()` from `@/lib/utils` for conditional class merging
- Tailwind CSS classes with design tokens from `globals.css`
- Color palette: warm stone neutrals with terracotta accent
- Dark mode via `next-themes` with CSS variables

### Data Fetching
- Server components fetch directly with Supabase server client
- Client components use Supabase browser client
- Always filter by `workspace_id` for multi-tenant isolation
```tsx
// Server component
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data } = await supabase.from('people').select('*').eq('workspace_id', wsId);

// Client component
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

### Authentication & Authorization
- **Magic Link** authentication (no passwords)
- Five role levels: `owner` > `admin` > `editor` > `contributor` > `viewer`
- Use permission utilities from `@/lib/permissions.ts`:
  - `canView()`, `canEdit()`, `canContribute()`, `isAdmin()`, `isOwner()`
- Access `WorkspaceContext` via `useWorkspace()` hook

### Database Patterns
- All tables have Row Level Security (RLS) enabled
- Always use `workspace_id` in queries for isolation
- Use database functions for complex operations (defined in migrations)
- Audit logging is automatic via triggers

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant workspace containers |
| `memberships` | User-workspace relationships with roles |
| `profiles` | User profile extensions |
| `people` | Family members with flexible names/dates |
| `relationships` | Family connections (9 types) |
| `events` | Life events (birth, death, marriage, etc.) |
| `sources` | Documents, photos, URLs, notes |
| `citations` | Links sources to entities |
| `groups` | User groups for visibility control |
| `entity_visibility` | Granular access control |
| `suggestions` | AI-generated data proposals |
| `activity_log` | Audit trail |

### Date Precision
Dates use precision indicators: `exact`, `year`, `month`, `circa`, `range`, `unknown`

### Relationship Types
`parent_child`, `spouse`, `sibling`, `adoptive_parent`, `step_parent`, `foster_parent`, `guardian`, `partner`, `other`

## API Routes

### POST /api/extract
AI-powered extraction using Claude. Analyzes text and creates suggestions.
```typescript
// Request
{ workspace_id: string, text: string, source_id?: string }

// Response
{ people: [], events: [], notes: [], relationships: [], suggestions_created: number }
```

### POST /api/ingest
Pattern-based extraction (regex fallback). Creates suggestions for review.
```typescript
// Request
{ workspace_id: string, text: string, source_id?: string }

// Response
{ people_found: number, dates_found: number, places_found: number, suggestions_created: number }
```

## Key Features

### AI Extraction Pipeline
1. User inputs text via QuickCapture component
2. POST to `/api/extract` with Claude analysis
3. Claude returns structured genealogical data
4. Suggestions created for user review
5. User approves/rejects in Suggestions page

### Duplicate Detection
Located in `src/lib/duplicate-detection.ts`:
- Levenshtein distance for edit similarity
- Soundex for phonetic matching
- Token overlap for multi-word names
- Date and location similarity scoring

### Visibility System
Three levels: `public`, `restricted` (group-based), `private` (user-specific)
Enforced via `entity_visibility` table and RLS policies.

## Code Quality

### TypeScript
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Prefer explicit types over `any`

### ESLint
- Next.js recommended config
- TypeScript integration

### Best Practices
- Async Server Components for data fetching
- Optimistic UI updates where appropriate
- Error boundaries for resilience
- Toast notifications for user feedback (Sonner)

## Common Tasks

### Adding a New Page
1. Create route in `src/app/(dashboard)/[route]/page.tsx`
2. Use `DashboardShell` for consistent layout
3. Fetch data with server Supabase client
4. Add to sidebar navigation if needed

### Adding a New Component
1. Create in appropriate `src/components/[category]/`
2. Export from component file
3. Use `'use client'` if interactive
4. Follow existing prop interface patterns

### Adding a Database Table
1. Create migration in `supabase/migrations/`
2. Include RLS policies
3. Add TypeScript types in `src/types/index.ts`
4. Update relevant components/queries

### Working with AI Extraction
1. Modify prompt in `/api/extract/route.ts` for Claude behavior
2. Update suggestion types in `src/types/index.ts`
3. Handle new suggestion types in Suggestions page

## Gotchas

- **Auth redirects**: Use `NEXT_PUBLIC_APP_URL` env var for correct protocol in production
- **Workspace context**: Must be within `WorkspaceProvider` to use `useWorkspace()`
- **RLS policies**: All queries must respect workspace isolation
- **Supabase clients**: Use `server.ts` for server components, `client.ts` for client
- **Date handling**: Always use utilities from `@/lib/dates.ts` for consistency

## Testing Locally

1. Start Supabase: `npx supabase start`
2. Run migrations: `npx supabase db push`
3. Start dev server: `npm run dev`
4. Access at http://localhost:3000
5. Supabase Studio at http://localhost:54323

## Git Workflow

- Main development on feature branches
- Commit messages follow conventional format
- Push changes to feature branch before PR
