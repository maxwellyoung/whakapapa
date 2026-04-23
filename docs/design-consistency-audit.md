# Design Consistency Audit

Last updated: 2026-04-23

## Scope

Reviewed current landing, auth, shared UI tokens, and off-palette usage in `src/app` and `src/components`. Guidelines baseline: Vercel Web Interface Guidelines fetched on 2026-04-23.

## Completed In This Pass

- `/login` now uses the dark archive visual system instead of generic light Clerk/SaaS-style controls.
- Auth form now has `name="email"`, `autocomplete="email"`, `inputMode="email"`, `spellCheck={false}`, inline status semantics, and visible Lamp focus.
- Primary auth buttons, OAuth button, divider, input, panel, and background now use Night/River/Lamp/Paper from the generated images.
- Core shared accents now use image-derived Lamp/Moss/River instead of arbitrary rust for normal UI states.
- Landing page now documents the visual source of truth in the interface itself.

## High-Priority Consistency Findings

| Area | Issue | Direction |
| --- | --- | --- |
| Shared public views | `shared-memory-view`, `shared-person-view`, and share error states still use Tailwind stone/light defaults. | Move to archive/paper tokens; public share pages should feel like a transmissible memory artifact. |
| Onboarding | `create-workspace` still uses neutral/stone gradients and generic onboarding cards. | Rebuild as paper atlas onboarding or dark archive shell depending on entry point. |
| Relationship tools | `relationship-finder` uses indigo/purple gradients and stone dropdowns. | Replace with Pattern 03 / Relation language and River/Moss path styling. |
| Media tools | `photo-tagger`, `document-scanner`, attachments still use blue/indigo/green status colors. | Use Moss for positive status, River for document/source, Lamp for active/focus. |
| Voice recorder | Routine recording UI uses bright red as primary action. | Use Umber/Lamp recording state unless destructive; reserve red for error/destructive. |
| Memory taxonomy | Story/anecdote/trait/tradition use blue/purple/pink/indigo. | Map taxonomy to image palette: Source/River, Voice/Moss, Relation/Lamp, Transmission/Paper/Umber. |
| Inline hardcoded colors | Several dashboard/story/search surfaces still use raw hex values for atlas text. | Replace with CSS tokens (`--atlas-ink`, `--atlas-copy`, `--atlas-muted`) to reduce drift. |

## Accessibility & Interface Findings

| File | Finding | Direction |
| --- | --- | --- |
| `src/app/(auth)/login/page.tsx` | Fixed: email field now has name/autocomplete/inputMode/spellcheck and status semantics. | Keep auth changes as reference implementation. |
| `src/components/share/share-password-gate.tsx` | Password gate still uses stone defaults and error text without surrounding archive context. | Convert to auth-panel style; add status semantics if error updates dynamically. |
| `src/components/photos/photo-tagger.tsx` | Uses raw `<img>` and has an `alt` warning in lint. | Replace with `next/image` where feasible or add explicit `alt`; document if canvas-style tool requires raw image. |
| `src/components/sources/document-scanner.tsx` | Uses raw `<img>` and generic indigo status. | Use `next/image`/explicit dimensions if possible; convert source color to River. |
| `src/app/(dashboard)/tree/page.tsx` | `useEffect` dependency warning remains. | Fix separately; do not mix with design token work unless touching tree behavior. |

## Code Quality Findings From Fallow

Fallow currently reports broad repo debt. These are not design blockers, but they affect maintainability:

- Dead code: 89 issues.
- Duplicate clone groups: 34.
- Health issues above threshold: 192.
- First suggested target: `src/components/ui/select.tsx`.
- High-complexity hotspots include `src/lib/gedcom-parser.ts`, `src/components/people/person-form.tsx`, and `src/app/(dashboard)/tree/page.tsx`.

## Recommended Next Passes

1. **Public Share Pass**: bring share pages, password gate, and shared memory/person views into archive/paper visual language.
2. **Capture Tools Pass**: align document scanner, photo tagger, attachments, and quick voice recorder with Source/Voice/Relation/Transmission color roles.
3. **Token Debt Pass**: replace remaining inline atlas hexes with semantic variables.
4. **Fallow Pass**: start with `src/components/ui/select.tsx`, then remove unused motion/loading/context exports.
5. **Accessibility Pass**: fix image warnings, ensure status messages and icon-only buttons are labeled, and audit forms for autocomplete.

## Directional Checklist For New Work

- Does every non-error accent come from the generated image palette?
- Is the surface dark archive, paper atlas, or memory artifact? Pick one before styling.
- Does the section have one job?
- Are icons symbolic and small, or are they decorative noise?
- Is motion explaining state/attention/handoff?
- Does the component pass the Web Interface Guidelines basics: labels, focus, semantics, reduced motion, and content overflow?

