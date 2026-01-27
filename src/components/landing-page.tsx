'use client'

import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useRef, useMemo } from 'react'
import Link from 'next/link'
import { Github } from 'lucide-react'

// ─── Motion constants ──────────────────────────────────────────
// Kowalski: spring-based, every transition intentional
const spring = { type: 'spring' as const, stiffness: 100, damping: 30 }
const gentleFade = { type: 'spring' as const, stiffness: 80, damping: 30 }

// ─── Scroll-reveal wrapper ─────────────────────────────────────
// Alexander: composable pattern — same structure, different content
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ ...spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Abstract visuals for each narrative section ───────────────

// "Scan" — lines of text floating up and reorganizing
function ScanVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const lines = useMemo(
    () => [
      { width: '70%', delay: 0 },
      { width: '55%', delay: 0.1 },
      { width: '80%', delay: 0.2 },
      { width: '40%', delay: 0.3 },
      { width: '65%', delay: 0.4 },
      { width: '50%', delay: 0.5 },
    ],
    []
  )

  return (
    <div ref={ref} className="relative h-48 md:h-56 flex items-center justify-center">
      {/* Source "document" — faded lines on the left */}
      <div className="absolute left-1/2 -translate-x-[140%] md:-translate-x-[160%] flex flex-col gap-2 opacity-30">
        {lines.map((line, i) => (
          <motion.div
            key={`src-${i}`}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.3 } : { opacity: 0 }}
            transition={{ ...gentleFade, delay: line.delay }}
            className="h-[3px] rounded-full bg-[var(--foreground)]"
            style={{ width: line.width === '80%' ? '64px' : line.width === '70%' ? '56px' : line.width === '65%' ? '52px' : line.width === '55%' ? '44px' : line.width === '50%' ? '40px' : '32px' }}
          />
        ))}
      </div>

      {/* Extracted structured lines — float into position */}
      <div className="flex flex-col gap-2.5 items-start">
        {lines.map((line, i) => (
          <motion.div
            key={`dest-${i}`}
            initial={{ opacity: 0, x: -20, y: 8 }}
            animate={
              isInView
                ? { opacity: [0, 0.6, 1], x: 0, y: 0 }
                : { opacity: 0, x: -20, y: 8 }
            }
            transition={{
              ...spring,
              delay: 0.3 + line.delay * 0.8,
              opacity: { duration: 0.8, delay: 0.3 + line.delay * 0.8 },
            }}
            className="h-[3px] rounded-full"
            style={{
              width: line.width,
              maxWidth: '120px',
              background: i === 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
              opacity: i === 0 ? 1 : 0.5,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// "Listen" — waveform bars
function ListenVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const bars = useMemo(() => {
    const heights = [20, 35, 50, 30, 60, 45, 25, 55, 40, 20, 48, 32, 58, 28, 42, 50, 22, 38, 55, 30, 45, 35, 52, 25]
    return heights.map((h, i) => ({ height: h, delay: i * 0.03 }))
  }, [])

  return (
    <div ref={ref} className="h-48 md:h-56 flex items-center justify-center">
      <div className="flex items-center gap-[3px]">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            initial={{ height: 3, opacity: 0 }}
            animate={
              isInView
                ? {
                    height: [3, bar.height * 0.7, bar.height, bar.height * 0.8, bar.height],
                    opacity: 1,
                  }
                : { height: 3, opacity: 0 }
            }
            transition={{
              height: {
                type: 'spring',
                stiffness: 120,
                damping: 15,
                delay: 0.2 + bar.delay,
              },
              opacity: { duration: 0.3, delay: 0.2 + bar.delay },
            }}
            className="w-[3px] rounded-full bg-[var(--foreground)]"
            style={{ opacity: isInView ? (0.3 + (bar.height / 60) * 0.7) : 0 }}
          />
        ))}
      </div>
    </div>
  )
}

// "Connect" — tree nodes with drawing lines
function ConnectVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="h-48 md:h-56 flex items-center justify-center">
      <svg
        viewBox="0 0 240 160"
        className="w-full max-w-[240px] h-auto"
        fill="none"
      >
        {/* Lines connecting nodes */}
        {[
          { d: 'M120 30 L60 75', delay: 0.4 },
          { d: 'M120 30 L180 75', delay: 0.5 },
          { d: 'M60 75 L40 130', delay: 0.7 },
          { d: 'M60 75 L90 130', delay: 0.8 },
          { d: 'M180 75 L155 130', delay: 0.9 },
          { d: 'M180 75 L205 130', delay: 1.0 },
        ].map((line, i) => (
          <motion.path
            key={i}
            d={line.d}
            stroke="var(--muted-foreground)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              isInView
                ? { pathLength: 1, opacity: 0.3 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{
              pathLength: { type: 'spring', stiffness: 50, damping: 20, delay: line.delay },
              opacity: { duration: 0.3, delay: line.delay },
            }}
          />
        ))}

        {/* Nodes */}
        {[
          { cx: 120, cy: 30, r: 8, delay: 0.2, primary: true },
          { cx: 60, cy: 75, r: 6, delay: 0.5, primary: false },
          { cx: 180, cy: 75, r: 6, delay: 0.6, primary: false },
          { cx: 40, cy: 130, r: 5, delay: 0.8, primary: false },
          { cx: 90, cy: 130, r: 5, delay: 0.9, primary: false },
          { cx: 155, cy: 130, r: 5, delay: 1.0, primary: false },
          { cx: 205, cy: 130, r: 5, delay: 1.1, primary: false },
        ].map((node, i) => (
          <motion.circle
            key={i}
            cx={node.cx}
            cy={node.cy}
            r={node.r}
            fill={node.primary ? 'var(--foreground)' : 'var(--muted-foreground)'}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isInView
                ? { scale: 1, opacity: node.primary ? 1 : 0.5 }
                : { scale: 0, opacity: 0 }
            }
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: node.delay,
            }}
          />
        ))}
      </svg>
    </div>
  )
}

// "Share" — concentric ripple circles
function ShareVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="h-48 md:h-56 flex items-center justify-center">
      <div className="relative">
        {/* Center dot */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="w-3 h-3 rounded-full bg-[var(--foreground)] relative z-10"
        />

        {/* Ripple rings */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isInView
                ? { scale: 1, opacity: [0, 0.4 - i * 0.08, 0.3 - i * 0.06] }
                : { scale: 0, opacity: 0 }
            }
            transition={{
              scale: {
                type: 'spring',
                stiffness: 60,
                damping: 20,
                delay: 0.4 + i * 0.15,
              },
              opacity: {
                duration: 1,
                delay: 0.4 + i * 0.15,
              },
            }}
            className="absolute rounded-full border border-[var(--foreground)]"
            style={{
              width: `${(i + 1) * 56}px`,
              height: `${(i + 1) * 56}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Narrative section — Alexander's pattern language ──────────
// Same structure, different content. Composable. Organic.
function NarrativeSection({
  title,
  description,
  visual,
  index,
}: {
  title: string
  description: string
  visual: React.ReactNode
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      ref={ref}
      className="h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Subtle top border — not a card, just a breath */}
      {index > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-px bg-[var(--border)]" />
      )}

      <div className="max-w-lg mx-auto text-center">
        {/* Visual first — let it speak */}
        {/* Kowalski: scale + blur entrance — cinematic reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
          transition={{ type: 'spring', stiffness: 60, damping: 25, delay: 0.05 }}
          className="mb-12"
        >
          {visual}
        </motion.div>

        {/* Title — one word, Newsreader, large */}
        {/* Kowalski: scale from 0.96 to 1 — cinematic, not bouncy */}
        <motion.h2
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 70, damping: 25, delay: 0.2 }}
          className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-4"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </motion.h2>

        {/* Description — one sentence, Inter, muted */}
        <motion.p
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
          transition={{ type: 'spring', stiffness: 60, damping: 25, delay: 0.4 }}
          className="text-base md:text-lg leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </motion.p>
      </div>
    </section>
  )
}

// ─── Hero heading — word by word reveal ────────────────────────
function HeroHeading() {
  const line1Words = ['Every', 'family', 'is', 'a', 'story.']
  const line2Words = ['Most', 'of', 'it', 'is', 'unwritten.']

  return (
    <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.5rem] font-semibold tracking-tight leading-[1.15] text-balance">
      <span className="block">
        {line1Words.map((word, i) => (
          <motion.span
            key={`l1-${i}`}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 80, damping: 22, delay: 0.3 + i * 0.1 }}
            className="inline-block mr-[0.3em]"
          >
            {word}
          </motion.span>
        ))}
      </span>
      <span className="block mt-1">
        {line2Words.map((word, i) => (
          <motion.span
            key={`l2-${i}`}
            initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 80, damping: 22, delay: 0.7 + i * 0.1 }}
            className="inline-block mr-[0.3em]"
          >
            {word}
          </motion.span>
        ))}
      </span>
    </h1>
  )
}

// ─── Leaf motif — subtle, integrated ───────────────────────────
function LeafMotif({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 40"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2C12 2 4 12 4 22C4 30 8 36 12 38C16 36 20 30 20 22C20 12 12 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.2"
        fill="none"
      />
      <path
        d="M12 8V34"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.15"
      />
    </svg>
  )
}

// ─── Main component ────────────────────────────────────────────

export function LandingPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  // Subtle parallax on hero — 1-2% movement (Cooper: depth, layering)
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -30])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const narrativeSections = [
    {
      title: 'Scan',
      description:
        'Point your camera at old letters and documents. Stories become structured memory.',
      visual: <ScanVisual />,
    },
    {
      title: 'Listen',
      description:
        'Record the stories in their own voice. Some things should be heard, not read.',
      visual: <ListenVisual />,
    },
    {
      title: 'Connect',
      description:
        'See the threads between people, across generations. A living map of belonging.',
      visual: <ConnectVisual />,
    },
    {
      title: 'Share',
      description:
        'Send a memory to someone who needs it. Family is the original network.',
      visual: <ShareVisual />,
    },
  ]

  return (
    <div
      className="min-h-screen overflow-y-auto"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        scrollSnapType: 'y proximity',
      }}
    >
      {/* ── Hero ── */}
      {/* Singer/Rams: strip everything unnecessary. What remains is essential. */}
      <header ref={heroRef} className="relative h-screen flex flex-col items-center justify-center px-6" style={{ scrollSnapAlign: 'start' }}>
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Leaf — integrated, not slapped on */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...gentleFade, delay: 0.1 }}
            className="flex justify-center mb-10"
          >
            <LeafMotif className="w-6 h-10 text-[var(--foreground)]" />
          </motion.div>

          {/* Heading — word by word, Kowalski spring */}
          <HeroHeading />

          {/* Subtitle — one line, muted */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-6 text-base md:text-lg"
            style={{ color: 'var(--muted-foreground)' }}
          >
            A place to gather what matters before it&rsquo;s gone.
          </motion.p>

          {/* CTA — single, honest */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 1.5 }}
            className="mt-12"
          >
            <Link
              href="/login"
              className="inline-block font-serif text-lg tracking-tight border-b-2 pb-0.5 transition-colors duration-300"
              style={{
                color: 'var(--accent)',
                borderColor: 'var(--accent)',
              }}
            >
              Begin
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll hint — gentle pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 3, delay: 2.5, repeat: Infinity, repeatDelay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="w-px h-8" style={{ background: 'var(--muted-foreground)' }} />
        </motion.div>
      </header>

      {/* ── Narrative sections ── */}
      {/* Alexander: same structure, different content. Organic repetition. */}
      {narrativeSections.map((section, i) => (
        <NarrativeSection
          key={section.title}
          title={section.title}
          description={section.description}
          visual={section.visual}
          index={i}
        />
      ))}

      {/* ── Whakapapa + CTA + Footer — final snap section ── */}
      {/* Cooper: information has weight without needing a box */}
      <section
        className="h-screen flex flex-col items-center justify-center px-6 relative"
        style={{ scrollSnapAlign: 'start' }}
      >
        <div className="flex flex-col items-center gap-16 md:gap-20">
          <Reveal className="max-w-xl mx-auto text-center">
            <LeafMotif className="w-4 h-7 text-[var(--foreground)] mx-auto mb-8 opacity-40" />
            <p
              className="font-serif text-lg md:text-xl italic leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <span style={{ color: 'var(--foreground)' }}>Whakapapa</span>{' '}
              <span className="text-sm md:text-base not-italic" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
                (fa·ka·pa·pa)
              </span>{' '}
              — the Māori word for the living web of stories that connect us across generations.
            </p>
          </Reveal>

          {/* Rams: honest, no manipulation */}
          <Reveal className="text-center" delay={0.2}>
            <Link
              href="/login"
              className="inline-block font-serif text-2xl md:text-3xl tracking-tight transition-colors duration-300 hover:opacity-70"
              style={{ color: 'var(--foreground)' }}
            >
              Start preserving
              <span style={{ color: 'var(--accent)' }}>.</span>
            </Link>
          </Reveal>
        </div>

        {/* Footer pinned to bottom of this section */}
        <footer className="absolute bottom-0 left-0 right-0 px-6 py-8 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-xl mx-auto flex items-center justify-between text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <span>Made in Aotearoa 🇳🇿</span>
            <a
              href="https://github.com/maxwellyoung/whakapapa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:opacity-70"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Github className="size-4" />
            </a>
          </div>
        </footer>
      </section>
    </div>
  )
}
