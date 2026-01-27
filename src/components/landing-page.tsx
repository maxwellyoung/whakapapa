'use client'

import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useRef, useMemo } from 'react'
import Link from 'next/link'
import { Github } from 'lucide-react'

// ─── Motion constants ──────────────────────────────────────────
// Kowalski: spring-based, every transition intentional
const spring = { type: 'spring' as const, stiffness: 100, damping: 30 }
const gentleFade = { type: 'spring' as const, stiffness: 80, damping: 30 }
const slowReveal = { type: 'spring' as const, stiffness: 60, damping: 25 }

// ─── Scroll-reveal wrapper ─────────────────────────────────────
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
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ ...spring, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Abstract visuals for each narrative section ───────────────

// "Remember" — floating memory fragments
function RememberVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const fragments = useMemo(
    () => [
      { width: 60, height: 3, x: 20, y: 30, delay: 0.1, opacity: 0.8 },
      { width: 45, height: 3, x: 40, y: 60, delay: 0.3, opacity: 0.6 },
      { width: 35, height: 3, x: 10, y: 90, delay: 0.5, opacity: 0.9 },
      { width: 55, height: 3, x: 65, y: 110, delay: 0.7, opacity: 0.7 },
      { width: 40, height: 3, x: 25, y: 140, delay: 0.9, opacity: 0.5 },
    ],
    []
  )

  return (
    <div ref={ref} className="relative h-48 md:h-56 flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-40" 
        style={{ background: 'radial-gradient(circle at center, var(--accent) 0%, transparent 70%)' }}
      />
      
      {/* Floating fragments */}
      <div className="relative w-32 h-32">
        {fragments.map((fragment, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20, x: 0 }}
            animate={
              isInView
                ? {
                    opacity: fragment.opacity,
                    y: 0,
                    x: Math.sin((Date.now() + i * 1000) / 3000) * 3,
                  }
                : { opacity: 0, y: 20, x: 0 }
            }
            transition={{
              ...slowReveal,
              delay: fragment.delay,
              y: { type: 'spring', stiffness: 60, damping: 20 },
              x: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: fragment.delay },
            }}
            className="absolute rounded-full bg-[var(--foreground)]"
            style={{
              width: `${fragment.width}px`,
              height: `${fragment.height}px`,
              left: `${fragment.x}%`,
              top: `${fragment.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// "Listen" — enhanced waveform with cultural rhythm
function ListenVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const bars = useMemo(() => {
    // Create a more organic rhythm inspired by kōrero (conversation)
    const heights = [22, 38, 45, 32, 58, 42, 28, 52, 36, 24, 46, 34, 56, 30, 44, 48, 26, 40, 54, 32, 47, 37, 50, 27, 41, 35, 53, 29]
    return heights.map((h, i) => ({ height: h, delay: i * 0.025 }))
  }, [])

  return (
    <div ref={ref} className="h-48 md:h-56 flex items-center justify-center">
      {/* Subtle background pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: [0, 0.1, 0] } : { opacity: 0 }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        className="absolute w-64 h-64 rounded-full bg-accent/10"
      />
      
      <div className="flex items-center gap-[2px]">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            initial={{ height: 2, opacity: 0 }}
            animate={
              isInView
                ? {
                    height: [2, bar.height * 0.6, bar.height, bar.height * 0.9, bar.height],
                    opacity: 1,
                  }
                : { height: 2, opacity: 0 }
            }
            transition={{
              height: {
                type: 'spring',
                stiffness: 100,
                damping: 12,
                delay: 0.3 + bar.delay,
              },
              opacity: { duration: 0.4, delay: 0.3 + bar.delay },
            }}
            className="w-[2.5px] rounded-full"
            style={{
              background: `linear-gradient(to top, var(--accent), var(--foreground))`,
              opacity: isInView ? (0.4 + (bar.height / 60) * 0.6) : 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// "Connect" — enhanced genealogy tree with flowing connections
function ConnectVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="h-48 md:h-56 flex items-center justify-center">
      {/* Background constellation effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 0.06 } : { opacity: 0 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"
      />
      
      <svg
        viewBox="0 0 280 180"
        className="w-full max-w-[280px] h-auto"
        fill="none"
      >
        {/* Enhanced connection lines with curves */}
        {[
          { d: 'M140 35 Q100 55 70 80', delay: 0.4 },
          { d: 'M140 35 Q180 55 210 80', delay: 0.5 },
          { d: 'M70 80 Q55 105 45 135', delay: 0.7 },
          { d: 'M70 80 Q85 105 95 135', delay: 0.8 },
          { d: 'M210 80 Q195 105 185 135', delay: 0.9 },
          { d: 'M210 80 Q225 105 235 135', delay: 1.0 },
          { d: 'M95 135 Q115 150 140 155', delay: 1.2 },
          { d: 'M185 135 Q165 150 140 155', delay: 1.3 },
        ].map((line, i) => (
          <motion.path
            key={i}
            d={line.d}
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              isInView
                ? { pathLength: 1, opacity: 0.4 }
                : { pathLength: 0, opacity: 0 }
            }
            transition={{
              pathLength: { type: 'spring', stiffness: 40, damping: 20, delay: line.delay },
              opacity: { duration: 0.5, delay: line.delay },
            }}
          />
        ))}

        {/* Enhanced nodes with cultural meaning */}
        {[
          { cx: 140, cy: 35, r: 10, delay: 0.2, primary: true, label: 'tūpuna' },
          { cx: 70, cy: 80, r: 7, delay: 0.5, primary: false, label: 'whānau' },
          { cx: 210, cy: 80, r: 7, delay: 0.6, primary: false, label: 'whānau' },
          { cx: 45, cy: 135, r: 6, delay: 0.8, primary: false, label: 'uri' },
          { cx: 95, cy: 135, r: 6, delay: 0.9, primary: false, label: 'uri' },
          { cx: 185, cy: 135, r: 6, delay: 1.0, primary: false, label: 'uri' },
          { cx: 235, cy: 135, r: 6, delay: 1.1, primary: false, label: 'uri' },
          { cx: 140, cy: 155, r: 8, delay: 1.4, primary: true, label: 'you' },
        ].map((node, i) => (
          <motion.g key={i}>
            <motion.circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={node.primary ? 'var(--accent)' : 'var(--foreground)'}
              initial={{ scale: 0, opacity: 0 }}
              animate={
                isInView
                  ? { scale: 1, opacity: node.primary ? 0.9 : 0.6 }
                  : { scale: 0, opacity: 0 }
              }
              transition={{
                type: 'spring',
                stiffness: 150,
                damping: 15,
                delay: node.delay,
              }}
            />
            {/* Subtle glow for primary nodes */}
            {node.primary && (
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r={node.r + 4}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1"
                opacity="0"
                initial={{ scale: 0.8 }}
                animate={
                  isInView
                    ? { scale: [0.8, 1.2, 1], opacity: [0, 0.3, 0] }
                    : { scale: 0.8, opacity: 0 }
                }
                transition={{
                  duration: 2,
                  delay: node.delay + 0.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
            )}
          </motion.g>
        ))}
      </svg>
    </div>
  )
}

// "Share" — enhanced ripples with whakapapa energy
function ShareVisual() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div ref={ref} className="h-48 md:h-56 flex items-center justify-center">
      <div className="relative">
        {/* Central heart/source */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ ...spring, delay: 0.2 }}
          className="w-4 h-4 rounded-full bg-accent relative z-10"
        />

        {/* Enhanced ripple rings with varying intensities */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={
              isInView
                ? { 
                    scale: [0, 1, 1.05], 
                    opacity: [0, 0.5 - i * 0.08, 0.4 - i * 0.06, 0] 
                  }
                : { scale: 0, opacity: 0 }
            }
            transition={{
              scale: {
                type: 'spring',
                stiffness: 50,
                damping: 20,
                delay: 0.4 + i * 0.2,
                duration: 1.5,
              },
              opacity: {
                duration: 2,
                delay: 0.4 + i * 0.2,
                ease: 'easeOut',
              },
            }}
            className="absolute rounded-full border"
            style={{
              width: `${(i + 1) * 64}px`,
              height: `${(i + 1) * 64}px`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              borderColor: i % 2 === 0 ? 'var(--accent)' : 'var(--foreground)',
              borderWidth: i === 0 ? '2px' : '1px',
            }}
          />
        ))}

        {/* Particles emanating from center */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
            animate={
              isInView
                ? {
                    scale: [0, 1, 0.8],
                    opacity: [0, 0.6, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 80,
                    y: Math.sin((i * Math.PI * 2) / 8) * 80,
                  }
                : { scale: 0, opacity: 0, x: 0, y: 0 }
            }
            transition={{
              duration: 2.5,
              delay: 1 + i * 0.1,
              ease: 'easeOut',
            }}
            className="absolute w-1.5 h-1.5 rounded-full bg-accent"
            style={{
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

// ─── Enhanced narrative section ──────────────────────────────────
function NarrativeSection({
  title,
  description,
  subtitle,
  visual,
  index,
}: {
  title: string
  description: string
  subtitle?: string
  visual: React.ReactNode
  index: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative"
      style={{ scrollSnapAlign: 'start' }}
    >
      {/* Subtle section divider */}
      {index > 0 && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={isInView ? { scaleX: 1, opacity: 0.2 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.1 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 w-16 h-px bg-accent"
        />
      )}

      <div className="max-w-2xl mx-auto text-center">
        {/* Visual with enhanced entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
          animate={isInView ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
          transition={{ type: 'spring', stiffness: 50, damping: 25, delay: 0.1 }}
          className="mb-16"
        >
          {visual}
        </motion.div>

        {/* Title with enhanced typography */}
        <motion.h2
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 16, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 60, damping: 25, delay: 0.3 }}
          className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-6 text-balance"
          style={{ color: 'var(--foreground)' }}
        >
          {title}
        </motion.h2>

        {/* Subtitle in Māori if provided */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ ...slowReveal, delay: 0.5 }}
            className="text-lg md:text-xl italic font-light mb-4"
            style={{ color: 'var(--accent)' }}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Description with enhanced spacing */}
        <motion.p
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 12, filter: 'blur(6px)' }}
          transition={{ type: 'spring', stiffness: 50, damping: 25, delay: 0.7 }}
          className="text-lg md:text-xl leading-relaxed max-w-lg mx-auto text-balance"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </motion.p>
      </div>
    </section>
  )
}

// ─── Enhanced hero heading with more poetic flow ─────────────────
function HeroHeading() {
  const line1Words = ['In', 'every', 'family,']
  const line2Words = ['stories', 'live', 'between', 'the', 'words.']
  const line3Words = ['Some', 'wait', 'to', 'be', 'found.']

  return (
    <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.1] text-balance">
      <span className="block">
        {line1Words.map((word, i) => (
          <motion.span
            key={`l1-${i}`}
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 70, damping: 20, delay: 0.4 + i * 0.12 }}
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
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 70, damping: 20, delay: 0.8 + i * 0.1 }}
            className="inline-block mr-[0.3em]"
          >
            {word}
          </motion.span>
        ))}
      </span>
      <span className="block mt-1">
        {line3Words.map((word, i) => (
          <motion.span
            key={`l3-${i}`}
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ type: 'spring', stiffness: 70, damping: 20, delay: 1.3 + i * 0.1 }}
            className="inline-block mr-[0.3em]"
            style={{ color: i === line3Words.length - 1 ? 'var(--accent)' : 'inherit' }}
          >
            {word}
          </motion.span>
        ))}
      </span>
    </h1>
  )
}

// ─── Enhanced leaf motif with subtle animation ────────────────────
function LeafMotif({ className = '', animated = false }: { className?: string; animated?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 24 40"
      fill="none"
      className={className}
      aria-hidden="true"
      initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={animated ? { ...gentleFade, delay: 0.1 } : undefined}
    >
      <motion.path
        d="M12 2C12 2 4 12 4 22C4 30 8 36 12 38C16 36 20 30 20 22C20 12 12 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
        fill="none"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={animated ? { duration: 2, delay: 0.5 } : undefined}
      />
      <motion.path
        d="M12 8V34"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.2"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={animated ? { duration: 1.5, delay: 1 } : undefined}
      />
    </motion.svg>
  )
}

// ─── Main component with enhanced structure ──────────────────────
export function LandingPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  
  // Subtle parallax - Cooper: depth through layering
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const narrativeSections = [
    {
      title: 'Remember',
      subtitle: 'whakamahara',
      description:
        'Hold your phone to old letters, faded photos, handwritten notes. Watch as AI reads between the lines, finding the stories hidden in every crease and margin.',
      visual: <RememberVisual />,
    },
    {
      title: 'Listen',
      subtitle: 'whakarongo',
      description:
        'Capture the stories that live in voices — the way kuia tells a tale, the pauses that hold meaning. Some wisdom can only be heard, never written.',
      visual: <ListenVisual />,
    },
    {
      title: 'Connect',
      subtitle: 'whakangaatahi',
      description:
        'Discover the invisible threads between generations. See how your great-grandfather\'s story echoes in your daughter\'s laugh. Every connection reveals the living whakapapa.',
      visual: <ConnectVisual />,
    },
    {
      title: 'Share',
      subtitle: 'tuku',
      description:
        'Send a memory to someone who needs it today. Watch how one story ripples across the whānau, connecting hearts across oceans and time.',
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
      {/* ── Enhanced hero ── */}
      <header ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20" style={{ scrollSnapAlign: 'start' }}>
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_25%_25%,var(--foreground)_1px,transparent_1px),radial-gradient(circle_at_75%_75%,var(--foreground)_1px,transparent_1px)] bg-[length:60px_60px,80px_80px]" />
        
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          {/* Enhanced leaf with animation */}
          <motion.div
            className="flex justify-center mb-12"
          >
            <LeafMotif className="w-7 h-11 text-accent" animated />
          </motion.div>

          {/* Enhanced heading */}
          <HeroHeading />

          {/* Enhanced subtitle with more breathing room */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            className="mt-8 text-lg md:text-xl leading-relaxed max-w-xl mx-auto"
            style={{ color: 'var(--muted-foreground)' }}
          >
            An AI companion for preserving the stories that make us who we are, before they're lost to time.
          </motion.p>

          {/* Enhanced CTA with more cultural resonance */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 2.3 }}
            className="mt-16 space-y-4"
          >
            <Link
              href="/login"
              className="inline-block group font-serif text-xl md:text-2xl tracking-tight transition-all duration-500"
            >
              <span 
                className="border-b-2 pb-1 transition-all duration-300 group-hover:pb-2"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
              >
                Begin the journey
              </span>
            </Link>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2.8 }}
              className="text-sm tracking-wide"
              style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}
            >
              tīmata te haerenga
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Enhanced scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.4, 0],
            y: [0, 8, 0]
          }}
          transition={{ 
            duration: 2.5, 
            delay: 3.5, 
            repeat: Infinity, 
            repeatDelay: 2 
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-accent to-transparent" />
          <div className="w-1 h-1 rounded-full bg-accent opacity-60" />
        </motion.div>
      </header>

      {/* ── Enhanced narrative sections ── */}
      {narrativeSections.map((section, i) => (
        <NarrativeSection
          key={section.title}
          title={section.title}
          subtitle={section.subtitle}
          description={section.description}
          visual={section.visual}
          index={i}
        />
      ))}

      {/* ── Enhanced final section with deeper cultural context ── */}
      <section
        className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative"
        style={{ scrollSnapAlign: 'start' }}
      >
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-60" 
          style={{ background: 'radial-gradient(ellipse at center, var(--accent) 0%, transparent 50%, transparent 100%)' }}
        />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <Reveal className="mb-16">
            <LeafMotif className="w-6 h-10 text-accent mx-auto mb-12 opacity-60" />
            <div className="space-y-8">
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-balance">
                <span style={{ color: 'var(--accent)' }}>Whakapapa</span>{' '}
                <span style={{ color: 'var(--foreground)' }}>is the spine that holds us</span>
              </h2>
              
              <div className="max-w-2xl mx-auto space-y-6">
                <p className="text-lg md:text-xl italic leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  <span className="text-sm not-italic opacity-70">wha·ka·pa·pa</span>{' '}
                  <span className="not-italic">/</span> 
                  <span className="text-sm not-italic opacity-70">ˈfakaˌpapa</span>
                </p>
                
                <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  In te reo Māori, whakapapa means to place in layers — the genealogical connections that 
                  bind us to everyone who came before, and everyone yet to come. It is the living bridge between 
                  past and future, the stories that flow through bloodlines like rivers through valleys.
                </p>
                
                <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  Every family is a universe of untold stories. We're here to help you find them, preserve them, 
                  and share them with the people who matter most — before time carries them away like leaves on the wind.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Enhanced final CTA */}
          <Reveal className="mt-20" delay={0.3}>
            <div className="space-y-6">
              <Link
                href="/login"
                className="inline-block group font-serif text-2xl md:text-3xl lg:text-4xl tracking-tight transition-all duration-500"
                style={{ color: 'var(--foreground)' }}
              >
                <span className="transition-all duration-300 group-hover:tracking-wide">
                  Begin weaving your whakapapa
                </span>
                <span style={{ color: 'var(--accent)' }} className="transition-all duration-300 group-hover:ml-2">.</span>
              </Link>
              
              <p 
                className="text-base opacity-60 font-light tracking-wide" 
                style={{ color: 'var(--muted-foreground)' }}
              >
                tīmata te raranga i tō whakapapa
              </p>
            </div>
          </Reveal>
        </div>

        {/* Enhanced footer */}
        <footer className="absolute bottom-0 left-0 right-0 px-6 py-8 border-t border-opacity-20" style={{ borderColor: 'var(--accent)' }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span style={{ color: 'var(--muted-foreground)' }}>
                Crafted in Aotearoa New Zealand 🇳🇿
              </span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-accent opacity-40" />
              <span className="hidden sm:inline-block text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                Te Whanganui-a-Tara, Wellington
              </span>
            </div>
            
            <a
              href="https://github.com/maxwellyoung/whakapapa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-60"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Github className="size-4" />
              <span className="text-xs opacity-70">Open source</span>
            </a>
          </div>
        </footer>
      </section>
    </div>
  )
}