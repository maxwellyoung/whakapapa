# Design Consistency Audit

Last updated: 2026-04-23

## Scope

Reviewed current landing, auth, shared UI tokens, and off-palette usage in `src/app` and `src/components`. Guidelines baseline: Vercel Web Interface Guidelines fetched on 2026-04-23.

## Completed In This Pass

- `/login` now uses the dark archive visual system instead of generic light Clerk/SaaS-style controls.
- Auth form now has `name="email"`, `autocomplete="email"`, `inputMode="email"`, `spellCheck={false}`, inline status semantics, and visible Lamp focus.
- Primary auth buttons, OAuth button, divider, input, panel, and background now use Night/River/Lamp/Paper from the generated images.
- Core shared accents now use image-derived Lamp/Moss/River instead of arbitrary rust for normal UI states.
- Landing page no longer explains the color system in-product; color rationale lives in docs.
- Public share pages, password gate, onboarding, Story Mode, document scanner, mihimihi, and quick voice recorder now use archive/atlas tokens.
- Unreachable citation/photo tagging/use-user code was removed; service worker and test entry points are explicitly suppressed for Fallow.

## High-Priority Consistency Findings

| Area | Issue | Direction |
| --- | --- | --- |
| Shared public views | Fixed: `shared-memory-view`, `shared-person-view`, password gate, and share error states now use archive artifact styling. | Continue testing with real share tokens and private/password variants. |
| Onboarding | Fixed: `create-workspace` now uses paper atlas styling and opens the welcome dialog after archive creation. | Audit the first-person flow after real auth/session setup. |
| Relationship tools | `relationship-finder` uses indigo/purple gradients and stone dropdowns. | Replace with Pattern 03 / Relation language and River/Moss path styling. |
| Media tools | `document-scanner` is aligned; attachments still use blue/stone status colors. | Use Moss for positive status, River for document/source, Lamp for active/focus. |
| Voice recorder | Fixed: routine recording UI no longer uses bright red as primary action. | Keep red reserved for destructive/error only. |
| Memory taxonomy | Story/anecdote/trait/tradition use blue/purple/pink/indigo. | Map taxonomy to image palette: Source/River, Voice/Moss, Relation/Lamp, Transmission/Paper/Umber. |
| Inline hardcoded colors | Story Mode atlas text was tokenized; deeper dashboard/media surfaces still have legacy Tailwind colors. | Continue replacing raw color classes only when touching those surfaces. |

## Accessibility & Interface Findings

| File | Finding | Direction |
| --- | --- | --- |
| `src/app/(auth)/login/page.tsx` | Fixed: email field now has name/autocomplete/inputMode/spellcheck and status semantics. | Keep auth changes as reference implementation. |
| `src/components/share/share-password-gate.tsx` | Fixed: gate now sits in archive context and errors use `role="alert"`. | Test with a real password-protected share token. |
| `src/components/sources/document-scanner.tsx` | Fixed: scanner now uses archive dropzone/atlas source colors and labeled input. | Keep raw preview image unless replacing with a known-dimension image component. |
| `src/app/(dashboard)/tree/page.tsx` | `useEffect` dependency warning remains. | Fix separately; do not mix with design token work unless touching tree behavior. |

## Code Quality Findings From Fallow

Fallow currently reports broad repo debt. These are not design blockers, but they affect maintainability:

- Dead code: reduced from 89 to 0 actionable issues in the focused pass; remaining runtime/test entry points are suppressed.
- Duplicate clone groups: 33.
- Health issues above threshold: 192.
- Removed unused Spring dependencies, stale `ui/motion.tsx`, duplicate share exports, and unused public exports/types.
- High-complexity hotspots include `src/lib/gedcom-parser.ts`, `src/components/people/person-form.tsx`, and `src/app/(dashboard)/tree/page.tsx`.

## Recommended Next Passes

1. **Relationship Tools Pass**: retheme relationship finder and relationship creation flows with Relation/path language.
2. **Attachments Pass**: align person attachments and remaining source status colors with Source/Voice/Relation/Transmission roles.
3. **Token Debt Pass**: replace remaining inline atlas hexes with semantic variables.
4. **Complexity Pass**: split Fallow health hotspots such as GEDCOM parsing, person form, and tree page into smaller units.
5. **Accessibility Pass**: fix image warnings, ensure status messages and icon-only buttons are labeled, and audit forms for autocomplete.

## Directional Checklist For New Work

- Does every non-error accent come from the generated image palette?
- Is the surface dark archive, paper atlas, or memory artifact? Pick one before styling.
- Does the section have one job?
- Are icons symbolic and small, or are they decorative noise?
- Is motion explaining state/attention/handoff?
- Does the component pass the Web Interface Guidelines basics: labels, focus, semantics, reduced motion, and content overflow?
