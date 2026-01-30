<p align="center">
  <h1 align="center">🌿 Whakapapa</h1>
  <p align="center">
    <strong>An AI-powered family knowledge base.</strong><br />
    Preserve your family's stories, relationships, and history.
  </p>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#database-setup">Database</a> ·
  <a href="#license">License</a>
</p>

---

## About the Name

**Whakapapa** (pronounced *fa-ka-pa-pa*) is a Māori word meaning genealogy, ancestry, and the layered connections between people across generations. In te ao Māori (the Māori worldview), whakapapa isn't just a family tree — it's the story of who you are, where you come from, and how everything connects.

We chose this name with deep respect for Māori culture. It captures exactly what this project is about: not just names and dates on a chart, but the living, breathing web of stories, relationships, and memories that make a family.

## Why Whakapapa?

Every family has stories that deserve to be remembered. The way your grandmother made her famous soup. The journey your great-grandfather took to a new country. The little quirks and sayings that get passed down without anyone writing them down — until someone does.

Whakapapa is built to be that place. A warm, private space where your family can gather its history — not as a dry database, but as a living collection of the things that matter.

## Features

🤖 **AI-Powered Extraction** — Drop in a photo of an old letter, a birth certificate, or a newspaper clipping. Claude AI reads it and suggests people, dates, and relationships to add to your tree.

🌳 **Interactive Family Tree** — See your family laid out as a beautiful, navigable tree. Zoom, search, connect people with a click. Parent-child hierarchies, partnerships, siblings — all visually distinct.

💬 **Memories & Stories** — Record stories, anecdotes, quotes, recipes, and family traditions. Attach them to the people they belong to. Voice record a grandparent's story directly in the app.

📸 **Document Scanning** — Scan physical documents with your phone's camera. OCR extracts the text. AI makes sense of it.

🎤 **Voice Recording** — Hit record and capture a story in someone's own voice. Transcription included.

🔗 **Shareable Links** — Create a link to share a memory or person's page with family members who don't have an account. Optional password protection and expiry.

📥 **GEDCOM Import** — Already have family data in another genealogy tool? Import your GEDCOM file and Whakapapa will parse it into people and relationships.

🏠 **Multi-Workspace** — Keep different family lines or projects in separate workspaces. Each with its own people, sources, and tree.

👥 **Role-Based Access** — Invite family members as owners, admins, editors, contributors, or viewers. Control who can see and edit what.

🔍 **Smart Search** — Find anyone in your tree instantly. Search across names, places, and notes with `⌘K`.

📋 **Interview Prompts** — Not sure what to ask? Built-in prompts help guide conversations: childhood memories, career stories, family traditions, life advice.

## Live Demo

🌐 **[whakapapa.vercel.app](https://whakapapa.vercel.app)** — Experience the app live

## Screenshots

![Whakapapa Landing Page](https://whakapapa.vercel.app/og-image.svg)

*The landing page showcases the cultural significance of whakapapa with elegant typography and subtle animations.*

<details>
<summary>Preview: Family Tree View</summary>

The interactive tree uses dagre for hierarchical layout with color-coded relationship lines:
- **Indigo arrows** → Parent-child
- **Pink dashed** → Partners/spouses  
- **Green dotted** → Siblings

Features include:
- ⌘K search across all people
- Keyboard navigation (arrows, enter)
- Right-click context menus
- Smooth zoom and pan
- Responsive layout

</details>

## Design Philosophy

**Cultural Respect** — Built with deep respect for Māori culture and the profound meaning of whakapapa as more than just genealogy.

**Motion with Purpose** — Inspired by Emil Kowalski's work, every animation serves the narrative and feels alive through spring physics.

**Editorial Aesthetic** — Clean typography using Newsreader serif for headings, generous whitespace, and a dark-first design language.

**Stories Over Data** — While other genealogy tools focus on dates and facts, Whakapapa prioritizes the stories that make families human.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | [Next.js 16](https://nextjs.org) | App router, server components, API routes |
| **Database** | [Supabase](https://supabase.com) | PostgreSQL, Auth, Storage, Row-Level Security |
| **AI** | [Claude (Anthropic)](https://anthropic.com) | Document text extraction, data parsing |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com) + [Radix](https://radix-ui.com) | Accessible, composable component primitives |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com) | Utility-first CSS with dark mode |
| **Tree Layout** | [dagre](https://github.com/dagrejs/dagre) + [React Flow](https://reactflow.dev) | Hierarchical graph visualization |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) | Fluid transitions and micro-interactions |
| **OCR** | [Tesseract.js](https://tesseract.projectnaptha.com/) | Client-side optical character recognition |
| **Validation** | [Zod](https://zod.dev) | Runtime type safety |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- An [Anthropic API key](https://console.anthropic.com) for AI features

### 1. Clone and install

```bash
git clone https://github.com/maxwellyoung/whakapapa.git
cd whakapapa
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Anthropic (for AI extraction)
ANTHROPIC_API_KEY=sk-ant-...

# App URL (for shareable links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Run the migrations against your Supabase project:

```bash
# If using Supabase CLI
supabase db push

# Or apply migrations manually in the Supabase SQL editor
# See supabase/migrations/ for all migration files
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be prompted to create your first workspace.

## Database Setup

All database migrations live in `supabase/migrations/`. They're numbered and should be applied in order:

| Migration | What it does |
|-----------|-------------|
| `001_initial_schema` | Core tables: profiles, workspaces, people, relationships, events, sources, citations |
| `002_suggestions` | AI suggestion queue for extracted data |
| `003_storage` | Supabase Storage buckets and policies |
| `004_fix_profile_trigger` | Profile creation trigger fix |
| `005_public_photos` | Public photo access policies |
| `006_memories_and_stories` | Memories, interview prompts, voice recordings, memorial tributes |
| `007_shareable_links` | Shareable link tokens with expiry and password protection |

If you're using the Supabase CLI, `supabase db push` handles everything. Otherwise, run each `.sql` file in order through the SQL editor in your Supabase dashboard.

## Project Structure

```
whakapapa/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Authenticated dashboard routes
│   │   │   ├── tree/           # Interactive family tree
│   │   │   ├── people/         # People list and profiles
│   │   │   ├── sources/        # Document and source management
│   │   │   ├── scan/           # Document scanner
│   │   │   ├── import/         # GEDCOM import
│   │   │   └── settings/       # Workspace settings, members, groups
│   │   └── api/                # API routes (AI extraction, ingestion)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── people/             # Person-related components
│   │   ├── sources/            # Source upload and AI ingestion
│   │   ├── layout/             # Sidebar, nav, workspace switcher
│   │   ├── capture/            # Quick capture widget
│   │   ├── photos/             # Photo tagging
│   │   ├── share/              # Shareable memory views
│   │   └── onboarding/         # Welcome flow and workspace creation
│   ├── lib/                    # Utilities and Supabase clients
│   └── types/                  # TypeScript type definitions
└── supabase/
    └── migrations/             # Database migration SQL files
```

## Contributing

This is a personal project, but contributions are welcome. If you're interested:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-thing`)
3. Commit your changes (`git commit -m 'Add amazing thing'`)
4. Push to the branch (`git push origin feature/amazing-thing`)
5. Open a Pull Request

## License

[MIT](LICENSE) — use it, learn from it, build on it.

---

<p align="center">
  <em>Built with care for the stories that make us who we are.</em>
</p>
