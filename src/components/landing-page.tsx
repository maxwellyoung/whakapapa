'use client'

import Link from 'next/link'
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { Github } from 'lucide-react'
import { useRef } from 'react'

type GlyphKind = 'recover' | 'listen' | 'trace' | 'share' | 'archive'

const storyTransition = {
  duration: 0.55,
  ease: [0.25, 1, 0.5, 1] as const,
}

const driftTransition = {
  duration: 12,
  repeat: Infinity,
  ease: 'linear' as const,
}

function SymbolGlyph({
  kind,
  className = '',
}: {
  kind: GlyphKind
  className?: string
}) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    className,
    'aria-hidden': true,
  }

  if (kind === 'recover') {
    return (
      <svg {...common}>
        <path d="M5 6.5H19V17.5H5Z" />
        <path d="M8 9.5H16" />
        <path d="M8 12.5H14" />
        <path d="M8 15.5H11" />
        <path d="M17.5 8L19.5 10" />
      </svg>
    )
  }

  if (kind === 'listen') {
    return (
      <svg {...common}>
        <path d="M5 14V10" />
        <path d="M8 17V7" />
        <path d="M11 14V10" />
        <path d="M14 18V6" />
        <path d="M17 13V11" />
        <path d="M20 16V8" />
      </svg>
    )
  }

  if (kind === 'trace') {
    return (
      <svg {...common}>
        <path d="M12 5V9" />
        <path d="M7 13L12 9L17 13" />
        <path d="M7 13V18" />
        <path d="M17 13V18" />
        <path d="M4.5 18H9.5" />
        <path d="M14.5 18H19.5" />
      </svg>
    )
  }

  if (kind === 'share') {
    return (
      <svg {...common}>
        <path d="M7 12H17" />
        <path d="M13 8L17 12L13 16" />
        <path d="M5 7H10" />
        <path d="M5 17H10" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M5 5.5H19V18.5H5Z" />
      <path d="M8 8.5H16" />
      <path d="M8 11.5H16" />
      <path d="M8 14.5H13" />
    </svg>
  )
}

function SectionIntro({
  marker,
  title,
  factual,
  emotional,
  accent,
}: {
  marker: string
  title: string
  factual: string
  emotional: string
  accent: GlyphKind
}) {
  return (
    <div className="space-y-6">
      <div className="archive-kicker">
        <SymbolGlyph kind={accent} className="size-4" />
        <span>{marker}</span>
      </div>
      <div className="space-y-4">
        <h2 className="font-serif text-[2rem] leading-[1] tracking-[-0.03em] text-[var(--text-primary)] md:text-[3.5rem]">
          {title}
        </h2>
        <p className="archive-caption max-w-md text-[var(--text-primary)]">{factual}</p>
        <p className="archive-caption max-w-md">{emotional}</p>
      </div>
    </div>
  )
}

function AnnotationRail() {
  const items = [
    { kind: 'recover' as const, label: 'Recover', text: 'Scan letters, notes, and the margins around them.' },
    { kind: 'listen' as const, label: 'Listen', text: 'Hold pauses, cadence, and names as they are spoken.' },
    { kind: 'trace' as const, label: 'Trace', text: 'Resolve family lines into a living map of relation.' },
    { kind: 'share' as const, label: 'Pass on', text: 'Send memory forward with source and context attached.' },
  ]

  return (
    <aside className="archive-panel archive-noise relative h-full min-h-[24rem] p-5">
      <div className="archive-rule-label mb-6">Annotation rail</div>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="group border-b border-[var(--border-etched)] pb-4 transition-colors duration-200 hover:border-[var(--accent)]"
          >
            <div className="mb-2 flex items-center gap-3 text-[var(--text-primary)]">
              <div className="flex size-8 items-center justify-center border border-[var(--border-etched)] bg-[var(--panel-elevated)] transition-colors duration-200 group-hover:border-[var(--accent)]">
                <SymbolGlyph kind={item.kind} className="size-4" />
              </div>
              <span className="archive-meta tracking-[0.22em]">{item.label}</span>
            </div>
            <p className="archive-caption text-sm">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="archive-dot-grid pointer-events-none absolute inset-x-5 bottom-5 top-auto h-20 opacity-50" />
    </aside>
  )
}

function ArtifactPlane({ offsetY }: { offsetY: MotionValue<number> }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      style={prefersReducedMotion ? undefined : { y: offsetY }}
      className="archive-panel archive-noise relative overflow-hidden p-4 md:p-6"
    >
      <div className="archive-rule-label mb-4">Recovered artifact</div>
      <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
        <div className="relative min-h-[22rem] border border-[var(--border-etched)] bg-[linear-gradient(180deg,rgba(229,223,209,0.95),rgba(200,190,174,0.78))] p-5 text-[rgba(47,40,32,0.88)] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(116,85,54,0.06)_100%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-[rgba(61,52,42,0.7)]">
                <span>Letter fragment</span>
                <span>1958</span>
              </div>
              <div className="space-y-2 text-sm leading-7">
                <p>Kia ora e moko,</p>
                <p>
                  The river was high this week and your koro said the old crossing still remembers every foot that
                  took it.
                </p>
                <div className="relative inline-block">
                  <span className="relative z-10">
                    Keep the names close, even the ones spoken quietly after the lamp is out.
                  </span>
                  <span className="absolute inset-x-[-0.2rem] bottom-[0.2rem] top-[0.7rem] bg-[rgba(173,120,73,0.28)]" />
                </div>
                <p>
                  I have written your grandmother&apos;s story in the margin. Do not let it travel alone.
                </p>
              </div>
            </div>
            <div className="archive-meta text-[rgba(61,52,42,0.7)]">Source: family letter, scanned from folded original</div>
          </div>
          <div className="pointer-events-none absolute inset-3 border border-[rgba(61,52,42,0.18)]" />
        </div>

        <div className="space-y-3">
          <div className="archive-panel-strong p-4">
            <div className="archive-rule-label mb-3">OCR layers</div>
            <div className="space-y-3">
              {[
                ['Name match', 'Mereana Raukawa', '99.2%'],
                ['Place', 'Ōtaki river crossing', '96.4%'],
                ['Source type', 'personal correspondence', '100%'],
              ].map(([label, value, confidence]) => (
                <div key={label} className="border-b border-[var(--border-etched)] pb-3 last:border-b-0 last:pb-0">
                  <div className="archive-meta mb-1">{label}</div>
                  <div className="flex items-end justify-between gap-4">
                    <div className="text-sm text-[var(--text-primary)]">{value}</div>
                    <div className="text-xs text-[var(--accent-soft)]">{confidence}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="archive-panel p-4">
            <div className="archive-rule-label mb-3">Margin note</div>
            <p className="archive-caption">
              Whakapapa surfaces in fragments first. The product recovers what was already present: names, places,
              handwritten context, and emotional weight.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ArchiveHero() {
  const heroRef = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const artifactY = useTransform(scrollYProgress, [0, 1], [0, -26])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -10])

  return (
    <header ref={heroRef} className="relative overflow-hidden px-6 pb-16 pt-8 md:px-8 md:pb-24 md:pt-10">
      <div className="archive-dot-grid absolute inset-x-6 top-16 h-[32rem] opacity-60 md:inset-x-8" />
      <div className="mx-auto max-w-7xl border-y border-[var(--border-etched)] py-4">
        <div className="archive-meta flex items-center justify-between gap-4">
          <span>Whakapapa archive interface</span>
          <span className="text-[var(--text-muted)]">Aotearoa New Zealand</span>
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_1.15fr_0.72fr]">
        <motion.div
          style={prefersReducedMotion ? undefined : { y: copyY }}
          className="flex min-h-[34rem] flex-col justify-between py-4"
        >
          <div className="space-y-8">
            <div className="archive-kicker">
              <SymbolGlyph kind="archive" className="size-4" />
              <span>Threshold / tomokanga</span>
            </div>
            <div className="space-y-5">
              <p className="archive-meta text-[var(--text-muted)]">Preserve. Hear. Trace. Pass on.</p>
              <h1 className="max-w-[12ch] font-serif text-[3.2rem] leading-[0.92] tracking-[-0.045em] text-[var(--text-primary)] md:text-[5.8rem]">
                Keep family memory in a form the future can still feel.
              </h1>
              <p className="archive-caption max-w-lg text-[var(--text-primary)]">
                Whakapapa turns letters, voices, and family lines into a living archive. It preserves source, context,
                and the quiet details that make memory belong to someone.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="archive-cta inline-flex items-center gap-3 border border-[var(--accent)] bg-[var(--panel-elevated)] px-5 py-3 text-sm uppercase tracking-[0.22em] text-[var(--text-primary)]"
              >
                <SymbolGlyph kind="archive" className="size-4" />
                <span>Begin preserving your whakapapa</span>
              </Link>
              <div className="archive-meta">tīmata te tiaki i tō whakapapa</div>
            </div>

            <div className="grid max-w-lg grid-cols-3 gap-3">
              {[
                ['Recover', 'letters, notes, and photo backs'],
                ['Listen', 'spoken memory with cadence intact'],
                ['Trace', 'family lines with source attached'],
              ].map(([title, detail]) => (
                <div key={title} className="archive-panel p-3">
                  <div className="archive-meta mb-2 text-[var(--accent-soft)]">{title}</div>
                  <p className="archive-caption text-sm">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <ArtifactPlane offsetY={artifactY} />

        <AnnotationRail />
      </div>
    </header>
  )
}

function RecoverySection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-18%' })
  const prefersReducedMotion = useReducedMotion()

  return (
    <section ref={sectionRef} className="relative px-6 py-18 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.3fr]">
        <div className="lg:sticky lg:top-12 lg:self-start">
          <SectionIntro
            marker="Recovery / whakaora kōrero"
            title="Recover what was already there."
            factual="Scan family artifacts and let the archive resolve names, dates, places, and handwritten context."
            emotional="The first thing returned is often not a fact, but recognition."
            accent="recover"
          />
        </div>

        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 26 }}
          whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={storyTransition}
          className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="archive-panel archive-noise relative overflow-hidden p-5">
            <div className="archive-rule-label mb-4">Artifact spread</div>
            <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="border border-[var(--border-etched)] bg-[var(--panel-elevated)] p-4">
                <div className="archive-meta mb-2">Photo back / annotation</div>
                <div className="space-y-2 text-sm leading-7 text-[var(--text-primary)]">
                  <p>Nan and her sisters after the summer harvest, 1962.</p>
                  <p className="text-[var(--text-muted)]">Written in blue pencil, lower edge cracked.</p>
                </div>
              </div>
              <div className="border border-[var(--border-etched)] bg-[var(--panel)] p-4">
                <div className="archive-meta mb-3">Detected layers</div>
                <div className="space-y-2">
                  {[
                    '3 people named and linked to existing line',
                    '1 location matched to oral account',
                    '1 uncertain surname flagged for review',
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-3">
                      <span className="mt-1 block size-2 border border-[var(--accent)]" />
                      <p className="archive-caption text-sm">{line}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <motion.div
              animate={
                prefersReducedMotion || !isInView
                  ? { opacity: 1 }
                  : { opacity: [0.4, 0.7, 0.45], x: [0, 8, 0] }
              }
              transition={prefersReducedMotion ? undefined : { ...driftTransition, duration: 8 }}
              className="pointer-events-none absolute left-6 right-12 top-28 h-px bg-[linear-gradient(90deg,transparent,var(--accent),transparent)]"
            />
          </div>

          <div className="space-y-4">
            <div className="archive-panel-strong p-4">
              <div className="archive-rule-label mb-4">Verification queue</div>
              <div className="space-y-4">
                {[
                  ['Person', 'Mereana Te Rangi', 'linked to line 02'],
                  ['Place', 'Manawatū crossing', 'spoken source agrees'],
                  ['Date', 'August 1962', 'extracted from reverse side'],
                ].map(([label, value, note]) => (
                  <div key={label} className="border-b border-[var(--border-etched)] pb-3 last:border-b-0 last:pb-0">
                    <div className="archive-meta mb-1">{label}</div>
                    <div className="text-sm text-[var(--text-primary)]">{value}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{note}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="archive-panel p-4">
              <div className="archive-rule-label mb-3">Why it matters</div>
              <p className="archive-caption">
                Recovery is not extraction for its own sake. Each detected detail stays attached to the source that gave
                it meaning.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function VoiceScene() {
  const prefersReducedMotion = useReducedMotion()
  const bars = [22, 38, 31, 56, 48, 28, 40, 22, 62, 35, 44, 27, 39, 52, 30, 47, 58, 34]

  return (
    <div className="archive-panel archive-noise relative overflow-hidden p-5 md:p-6">
      <div className="archive-rule-label mb-5">Voice capture</div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 border border-[var(--border-etched)] bg-[var(--panel-elevated)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="archive-meta text-[var(--accent-soft)]">Interview source</div>
              <div className="mt-1 text-sm text-[var(--text-primary)]">Kuia recollection, kitchen table recording</div>
            </div>
            <div className="archive-chip">
              <SymbolGlyph kind="listen" className="size-3.5" />
              <span>Saving</span>
            </div>
          </div>

          <div className="flex h-28 items-end gap-[5px] rounded-[18px] border border-[var(--border-etched)] bg-[rgba(8,10,12,0.7)] px-3 py-4">
            {bars.map((height, index) => (
              <motion.span
                key={`${height}-${index}`}
                animate={
                  prefersReducedMotion
                    ? { opacity: 1, scaleY: 1 }
                    : {
                        opacity: [0.45, 0.95, 0.6],
                        scaleY: [0.72, 1, 0.84],
                      }
                }
                transition={
                  prefersReducedMotion
                    ? undefined
                    : {
                        duration: 2.4 + (index % 4) * 0.18,
                        repeat: Infinity,
                        repeatType: 'mirror',
                        delay: index * 0.04,
                        ease: 'easeInOut',
                      }
                }
                className="origin-bottom rounded-full bg-[linear-gradient(180deg,var(--accent-soft),var(--signal-cool))]"
                style={{
                  width: 'calc((100% - 85px) / 18)',
                  height,
                }}
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Speaker', 'Aroha Tahana'],
              ['Session', '43 min'],
              ['Language', 'te reo / English'],
            ].map(([label, value]) => (
              <div key={label} className="border border-[var(--border-etched)] bg-[var(--panel)] p-3">
                <div className="archive-meta mb-2">{label}</div>
                <div className="text-sm text-[var(--text-primary)]">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="archive-panel-strong p-4">
            <div className="archive-rule-label mb-4">Transcript with pauses</div>
            <div className="space-y-4">
              <p className="text-sm leading-7 text-[var(--text-primary)]">
                “Your koro always paused before saying the river name
                <span className="mx-2 inline-flex gap-1 align-middle">
                  <span className="block size-1 rounded-full bg-[var(--signal-cool)]" />
                  <span className="block size-1 rounded-full bg-[var(--signal-cool)]" />
                  <span className="block size-1 rounded-full bg-[var(--signal-cool)]" />
                </span>
                because he wanted us to hear where we were standing.”
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-[var(--border-etched)] bg-[var(--panel)] p-3">
                  <div className="archive-meta mb-2">Meaning held</div>
                  <p className="archive-caption text-sm">Cadence markers preserved around place names and kinship terms.</p>
                </div>
                <div className="border border-[var(--border-etched)] bg-[var(--panel)] p-3">
                  <div className="archive-meta mb-2">Translation layer</div>
                  <p className="archive-caption text-sm">Parallel notes stay beside the voice, not instead of it.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="archive-panel p-4">
            <div className="archive-rule-label mb-3">Product note</div>
            <p className="archive-caption">
              Voices are archived as testimony, not just text. The spacing, hesitation, and warmth remain legible when
              memory is revisited later.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function VoiceSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="relative px-6 py-18 md:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          whileInView={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-15%' }}
          transition={storyTransition}
        >
          <VoiceScene />
        </motion.div>

        <div className="flex items-center lg:justify-end">
          <SectionIntro
            marker="Voice / whakarongo"
            title="Hear the person, not just the sentence."
            factual="Record spoken memory and keep the transcript, translation, and source notes in one place."
            emotional="Some knowledge arrives through tone, breath, and the room around the words."
            accent="listen"
          />
        </div>
      </div>
    </section>
  )
}

function LineageScene() {
  const graphRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const isInView = useInView(graphRef, { once: true, margin: '-18%' })

  const nodes = [
    { id: 'tupuna', label: 'Hinewai', meta: 'Tūpuna / 1898', x: '52%', y: '10%' },
    { id: 'bridge-left', label: 'Rangi', meta: 'Son / oral source', x: '28%', y: '34%' },
    { id: 'bridge-right', label: 'Mere', meta: 'Daughter / letter source', x: '72%', y: '34%' },
    { id: 'whanau-left', label: 'Tama', meta: 'Grandchild / photo back', x: '18%', y: '64%' },
    { id: 'whanau-mid', label: 'Aroha', meta: 'Grandchild / interview', x: '46%', y: '64%' },
    { id: 'whanau-right', label: 'Wiremu', meta: 'Grandchild / census note', x: '76%', y: '64%' },
    { id: 'today', label: 'You', meta: 'Living line / active archive', x: '58%', y: '86%' },
  ]

  const lines = [
    { d: 'M 52 11 C 45 18, 36 24, 28 34', delay: 0.1 },
    { d: 'M 52 11 C 59 18, 66 24, 72 34', delay: 0.2 },
    { d: 'M 28 34 C 24 46, 22 56, 18 64', delay: 0.3 },
    { d: 'M 28 34 C 34 46, 40 54, 46 64', delay: 0.45 },
    { d: 'M 72 34 C 72 46, 74 56, 76 64', delay: 0.6 },
    { d: 'M 46 64 C 48 74, 52 80, 58 86', delay: 0.75 },
    { d: 'M 76 64 C 72 72, 66 80, 58 86', delay: 0.9 },
  ]

  return (
    <div ref={graphRef} className="archive-panel archive-noise relative overflow-hidden p-5 md:p-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="archive-rule-label">Lineage field</div>
          <h3 className="font-serif text-[2.2rem] leading-[0.96] tracking-[-0.03em] text-[var(--text-primary)] md:text-[3rem]">
            Trace relation with source still attached.
          </h3>
          <p className="archive-caption max-w-md">
            The graph resolves from multiple evidence types: oral histories, letters, photos, and administrative
            records. Each link stays traceable back to where it came from.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Newly resolved', 'Mere linked to Hinewai through a 1958 letter margin'],
              ['Confidence', '3 corroborating sources across two branches'],
            ].map(([label, text]) => (
              <div key={label} className="border border-[var(--border-etched)] bg-[var(--panel-elevated)] p-3">
                <div className="archive-meta mb-2">{label}</div>
                <p className="archive-caption text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[30rem] border border-[var(--border-etched)] bg-[linear-gradient(180deg,rgba(15,18,21,0.9),rgba(9,11,13,0.92))]">
          <div className="archive-dot-grid absolute inset-0 opacity-40" />
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
            {lines.map((line, index) => (
              <motion.path
                key={line.d}
                d={line.d}
                fill="none"
                stroke="var(--signal-cool)"
                strokeWidth="0.7"
                strokeLinecap="round"
                pathLength={prefersReducedMotion ? 1 : 0}
                initial={prefersReducedMotion ? { opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
                animate={
                  isInView
                    ? prefersReducedMotion
                      ? { opacity: 0.55 }
                      : { pathLength: 1, opacity: 0.72 }
                    : prefersReducedMotion
                      ? { opacity: 0.55 }
                      : { pathLength: 0, opacity: 0 }
                }
                transition={prefersReducedMotion ? undefined : { ...storyTransition, delay: line.delay + index * 0.06 }}
              />
            ))}
          </svg>

          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={
                isInView
                  ? prefersReducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, y: 0 }
                  : prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 8 }
              }
              transition={prefersReducedMotion ? { duration: 0.2, delay: index * 0.04 } : { ...storyTransition, delay: 0.2 + index * 0.08 }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: node.x, top: node.y }}
            >
              <div className="min-w-[8rem] border border-[var(--border-etched)] bg-[rgba(9,11,13,0.92)] px-3 py-2 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                <div className="text-sm text-[var(--text-primary)]">{node.label}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{node.meta}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LineageSection() {
  return (
    <section className="relative px-6 py-18 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="grid gap-6 border-y border-[var(--border-etched)] py-6 md:grid-cols-[0.8fr_1.2fr]">
          <div className="archive-kicker">
            <SymbolGlyph kind="trace" className="size-4" />
            <span>Lineage / whakataki hononga</span>
          </div>
          <p className="archive-caption max-w-2xl">
            Family lines appear as a field of evidence, not a static tree. New relationships can be seen, checked, and
            handed on with the source intact.
          </p>
        </div>
        <LineageScene />
      </div>
    </section>
  )
}

function TransmissionScene() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="archive-panel archive-noise relative overflow-hidden p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="archive-rule-label">Transmission</div>
          <h3 className="font-serif text-[2.2rem] leading-[0.96] tracking-[-0.03em] text-[var(--text-primary)] md:text-[3rem]">
            Pass the story on without thinning it out.
          </h3>
          <p className="archive-caption max-w-md">
            Share a memory with the whānau member who needs it, along with its source, translation, and place in the
            line.
          </p>
          <div className="archive-panel p-4">
            <div className="archive-rule-label mb-3">Attached context</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Source', 'Kitchen-table interview, 12 Feb'],
                ['Related line', 'Hinewai → Mere → Aroha'],
                ['Shared with', '3 whānau members'],
                ['Prompt', 'Add your version of this memory'],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="archive-meta mb-1">{label}</div>
                  <div className="text-sm text-[var(--text-primary)]">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="archive-panel-strong relative z-10 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="archive-meta text-[var(--accent-soft)]">Shared memory card</div>
                <div className="mt-1 text-sm text-[var(--text-primary)]">Sent to the Tahana whānau thread</div>
              </div>
              <div className="archive-chip">
                <SymbolGlyph kind="share" className="size-3.5" />
                <span>Delivered</span>
              </div>
            </div>

            <div className="space-y-4 border border-[var(--border-etched)] bg-[var(--panel)] p-4">
              <div className="text-sm leading-7 text-[var(--text-primary)]">
                “Here is Nan&apos;s letter beside Aunty Aroha&apos;s retelling. They say the same crossing differently, but
                they meet in the same place.”
              </div>
              <div className="flex flex-wrap gap-2">
                {['letter fragment', 'audio excerpt', 'place note', 'family line'].map((chip) => (
                  <span key={chip} className="archive-chip">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            animate={
              prefersReducedMotion
                ? { opacity: 0.28, scale: 1 }
                : { opacity: [0.18, 0.34, 0.18], scale: [0.92, 1.04, 1.1] }
            }
            transition={prefersReducedMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent)]"
          />
        </div>
      </div>
    </div>
  )
}

function TransmissionSection() {
  return (
    <section className="relative px-6 pb-18 pt-18 md:px-8 md:pb-24 md:pt-24">
      <div className="mx-auto max-w-7xl space-y-10">
        <TransmissionScene />

        <div className="grid gap-8 border-t border-[var(--border-etched)] pt-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-5">
            <div className="archive-kicker">
              <SymbolGlyph kind="share" className="size-4" />
              <span>Invitation / tuku whakamua</span>
            </div>
            <h2 className="max-w-[13ch] font-serif text-[2.8rem] leading-[0.95] tracking-[-0.04em] text-[var(--text-primary)] md:text-[4.5rem]">
              Build the archive your descendants should inherit.
            </h2>
            <p className="archive-caption max-w-2xl">
              Whakapapa keeps family memory in circulation: grounded in source, clear in relation, and ready to be
              heard again.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/login"
              className="archive-cta inline-flex items-center gap-3 border border-[var(--accent)] bg-transparent px-5 py-3 text-sm uppercase tracking-[0.22em] text-[var(--text-primary)]"
            >
              <SymbolGlyph kind="archive" className="size-4" />
              <span>Begin preserving your whakapapa</span>
            </Link>
            <div className="archive-meta text-[var(--text-muted)]">A quiet beginning. A durable record.</div>
          </div>
        </div>

        <footer className="flex flex-col gap-4 border-t border-[var(--border-etched)] pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <div className="archive-meta flex flex-wrap items-center gap-4">
            <span>Crafted in Aotearoa New Zealand</span>
            <span className="text-[var(--text-muted)]">Te Whanganui-a-Tara, Wellington</span>
          </div>

          <a
            href="https://github.com/maxwellyoung/whakapapa"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            <Github className="size-4" />
            <span className="archive-meta">Open source</span>
          </a>
        </footer>
      </div>
    </section>
  )
}

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(123,140,153,0.04),transparent_18%,transparent_82%,rgba(176,116,73,0.05))]" />
      <ArchiveHero />
      <RecoverySection />
      <VoiceSection />
      <LineageSection />
      <TransmissionSection />
    </div>
  )
}
