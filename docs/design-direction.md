# Whakapapa Design Direction

Last updated: 2026-04-23

## North Star

Whakapapa should feel like a living archive: dithered, intimate, source-bound, and calm. The interface is not generic SaaS chrome around family data. It is a vessel for memory, voice, provenance, and relationship.

## Source of Truth

The generated dithered archive images are the visual authority. Interface color, texture, and atmosphere must be justified by those images first.

| Token | Value | Role | Source |
| --- | --- | --- | --- |
| Night | `#0F1D2B` | deep field, dark panels | hero + transmission images |
| River | `#12344F` | navigation, cool depth | hero + lineage images |
| Moss | `#5D8D7B` | living signal, secondary status | hero + recovery images |
| Lamp | `#CB994F` | primary warm accent, focus, CTA | hero lamp + transmission paths |
| Paper | `#EDCB88` | warm text highlights, subtle strokes | letters + recovery image |
| Umber | `#966738` | warning/destructive-adjacent warmth | transmission + recovery shadows |

Red is not a product accent. Use red only for true destructive or error states. If a surface is routine navigation, focus, hover, selection, or CTA, use Lamp, River, Moss, Paper, or Night.

## Aesthetic Principles

1. **Image-Led Palette**: no arbitrary brand colors. If a color cannot be traced to the imagery, it does not belong in core UI.
2. **Soft Futurism, Not Chrome**: blur, glow, and motion are allowed only when they make the archive feel alive or help orientation.
3. **Humane Minimalism**: copy should be useful, brief, and concrete. Avoid motivational SaaS language.
4. **Fluid Interfaces**: transitions should feel like attention moving through a family thread. Prefer transform/opacity, short durations, and visible state continuity.
5. **Pre-Internet Interface Metaphysics**: grids, coordinates, and source labels can appear as quiet structure, not decorative clutter.
6. **Symbolic Micro-Iconography**: icons should read at small sizes and behave like archive marks, not illustration.
7. **Pattern Language Structure**: important flows should name their pattern: Source, Voice, Relation, Transmission.
8. **Moral Baseline**: clarity beats novelty. Sensitive family content needs restraint, legibility, and trust.

## Layout Rules

- Landing hero is full-bleed and image-led.
- Product/dashboard surfaces use warm paper panels with minimal chrome.
- Auth/share surfaces use the dark archive shell when public or semi-public.
- Cards are permitted only when the card is the interaction or contains a self-contained artifact.
- Avoid generic card grids as the first impression.
- Use generous negative space, but never leave content hidden or visually disconnected.

## Motion Grammar

- Buttons: `transform: scale(0.98)` active feedback, 100-180ms.
- Hover: small translate or image scale only when it clarifies affordance.
- Entrances: first-view/marketing only; never hide core content until scrolled.
- Repeated work surfaces: minimal or no animation.
- Always honor `prefers-reduced-motion`.
- Never use `transition: all`.

## Typography

- Display: `Sentient`, then Charter/Georgia fallback.
- Body: `General Sans`.
- Use large serif headlines for archive/marketing moments.
- Use restrained sans labels for system and product orientation.
- Headings should use `text-wrap: balance` or equivalent where practical.

## Component Rules

- Primary action: Lamp border/fill on dark surfaces, atlas ink on paper surfaces.
- Focus states: Lamp rings, not browser defaults or rust leftovers.
- Inputs: explicit label, `name`, `autocomplete`, correct `type`, and visible focus.
- Status messages: inline and `aria-live="polite"` or `role="alert"` for errors.
- Icons: `aria-hidden="true"` unless they are the only accessible label.
- Image assets: meaningful `alt`; below-fold images lazy unless needed for LCP.

## Current Visual System Areas

| Area | Direction |
| --- | --- |
| Landing | dark, full-bleed, dithered archive poster |
| Auth | dark archive shell, Lamp/Paper controls, image-backed atmosphere |
| Dashboard | paper atlas, dense but readable, one warm action accent |
| Story Search | atlas surface, thread/path language, restrained generated warmth |
| Share/Public Views | should migrate from stone defaults to archive/paper language next |

