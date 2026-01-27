'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import {
  Brain,
  TreePine,
  BookOpen,
  Mic,
  ScanText,
  FileDown,
  Share2,
  FolderTree,
  ArrowRight,
  Github,
  Heart,
} from 'lucide-react'

// ─── Animation variants ────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const featureCard = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

// ─── Animated section wrapper ──────────────────────────────────

function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

// ─── Features data ─────────────────────────────────────────────

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Extraction',
    description:
      'Scan documents, photos, and letters — Claude AI extracts people, dates, and relationships automatically.',
  },
  {
    icon: TreePine,
    title: 'Interactive Family Tree',
    description:
      'Explore your lineage through a beautiful visual tree. Zoom, pan, and discover connections.',
  },
  {
    icon: BookOpen,
    title: 'Memories & Stories',
    description:
      'Record the stories that matter — quotes, recipes, traditions, and the moments that shaped your family.',
  },
  {
    icon: Mic,
    title: 'Voice Recording',
    description:
      "Capture stories in your loved ones' own voice. Some things are best heard, not read.",
  },
  {
    icon: ScanText,
    title: 'Document Scanning',
    description:
      'Point your camera at old documents and photos. Built-in OCR reads handwriting and printed text.',
  },
  {
    icon: FileDown,
    title: 'GEDCOM Import',
    description:
      'Already started elsewhere? Import your family tree from Ancestry, MyHeritage, or any GEDCOM-compatible tool.',
  },
  {
    icon: Share2,
    title: 'Shareable Links',
    description:
      'Share memories and stories with family members through simple, private links.',
  },
  {
    icon: FolderTree,
    title: 'Multi-Workspace',
    description:
      'Keep separate family lines organised in their own spaces. Your whakapapa, your way.',
  },
]

// ─── Main component ────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl" role="img" aria-label="leaf">🌿</span>
            <span className="font-serif text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Whakapapa
            </span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium
              bg-[var(--accent)] text-white shadow-sm
              hover:opacity-90 transition-opacity duration-200
              active:scale-[0.98] active:transition-none"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="pt-32 pb-20 px-6 md:pt-44 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-6"
          >
            <span className="text-5xl md:text-6xl" role="img" aria-label="leaf">🌿</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.1] mb-6"
          >
            Preserve your family&rsquo;s stories, relationships, and history.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--muted-foreground)] leading-relaxed max-w-2xl mx-auto mb-10"
          >
            An AI-powered family knowledge base that helps you collect, connect, and cherish
            the people and moments that make your family unique.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 }}
          >
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium
                bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20
                hover:shadow-lg hover:shadow-[var(--accent)]/25 hover:opacity-95
                transition-all duration-200
                active:scale-[0.98] active:transition-none"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* ── Decorative divider ── */}
      <div className="flex items-center justify-center gap-3 pb-16 md:pb-24 text-[var(--border)]">
        <div className="h-px w-12 bg-[var(--border)]" />
        <span className="text-xs tracking-[0.2em] uppercase text-[var(--muted-foreground)] font-medium">
          What you can do
        </span>
        <div className="h-px w-12 bg-[var(--border)]" />
      </div>

      {/* ── Features ── */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Everything your family story needs
            </h2>
            <p className="text-[var(--muted-foreground)] text-lg max-w-xl mx-auto">
              From scanning old letters to recording grandma&rsquo;s recipes — all in one place.
            </p>
          </AnimatedSection>

          <FeaturesGrid />
        </div>
      </section>

      {/* ── About the name ── */}
      <section className="px-6 pb-20 md:pb-28">
        <AnimatedSection>
          <div className="mx-auto max-w-3xl">
            <div className="surface-raised p-8 md:p-12 text-center">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium tracking-wide uppercase
                bg-[var(--accent)]/10 text-[var(--accent)] mb-6 border border-[var(--accent)]/20">
                About the name
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-6">
                Whakapapa
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] italic mb-6 tracking-wide">
                /fa·ka·pa·pa/
              </p>
              <div className="space-y-4 text-[var(--foreground)]/80 leading-relaxed max-w-xl mx-auto text-left md:text-center">
                <p>
                  In te ao Māori — the Māori worldview — <em className="font-serif not-italic font-medium text-[var(--foreground)]">whakapapa</em> is
                  far more than a family tree. It is the foundational concept of genealogy, identity, and belonging.
                </p>
                <p>
                  Whakapapa traces the connections between all living things — from the gods of the natural world,
                  through ancestors, to the people standing here today. It answers the most human question:
                  <em className="font-serif not-italic font-medium text-[var(--foreground)]"> where do I come from?</em>
                </p>
                <p>
                  We chose this name with deep respect for te reo Māori and the culture from which it originates,
                  as a reminder that genealogy is not just data — it is the living fabric of who we are.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 pb-24 md:pb-32">
        <AnimatedSection>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Start preserving your family&rsquo;s story
            </h2>
            <p className="text-[var(--muted-foreground)] text-lg mb-8 max-w-lg mx-auto">
              Every family has stories worth keeping. Yours is no exception.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-medium
                bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20
                hover:shadow-lg hover:shadow-[var(--accent)]/25 hover:opacity-95
                transition-all duration-200
                active:scale-[0.98] active:transition-none"
            >
              Begin your whakapapa
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--muted-foreground)]">
          <div className="flex items-center gap-2">
            <span role="img" aria-label="leaf">🌿</span>
            <span className="font-serif font-medium text-[var(--foreground)]">Whakapapa</span>
            <span className="text-[var(--border)]">·</span>
            <span>Open source under MIT</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              Made with <Heart className="size-3.5 text-[var(--accent)] fill-[var(--accent)]" /> in Aotearoa
            </span>
            <a
              href="https://github.com/maxwellyoung/whakapapa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors"
            >
              <Github className="size-4" />
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ─── Features grid (separate for in-view animation) ────────────

function FeaturesGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {features.map((feature) => (
        <motion.div
          key={feature.title}
          variants={featureCard}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="group surface p-5 hover:shadow-md transition-shadow duration-300"
        >
          <div className="mb-3 inline-flex items-center justify-center size-10 rounded-xl
            bg-[var(--accent)]/10 text-[var(--accent)]
            group-hover:bg-[var(--accent)]/15 transition-colors duration-300">
            <feature.icon className="size-5" />
          </div>
          <h3 className="font-medium text-sm mb-1.5 text-[var(--foreground)]">
            {feature.title}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </motion.div>
  )
}
