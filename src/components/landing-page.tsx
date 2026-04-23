'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Github } from 'lucide-react'

type ArtworkKind = 'artifact' | 'recovery' | 'voice' | 'lineage' | 'transmission'
type SymbolKind = 'recover' | 'listen' | 'trace' | 'share'

const archiveIllustrations: Record<ArtworkKind, { src: string; alt: string }> = {
  artifact: {
    src: '/landing/hero-artifact-web.png',
    alt: 'Retro dithered family letter on a desk beside a lamp and river horizon.',
  },
  recovery: {
    src: '/landing/recovery-photo-web.png',
    alt: 'Retro dithered family photo being annotated and indexed.',
  },
  voice: {
    src: '/landing/voice-interview-web.png',
    alt: 'Retro dithered kitchen-table voice recording scene.',
  },
  lineage: {
    src: '/landing/lineage-map-web.png',
    alt: 'Retro dithered rivers, stars, and branching family lines.',
  },
  transmission: {
    src: '/landing/transmission-thread-web.png',
    alt: 'Retro dithered memory card shared through a family thread.',
  },
}

const proofItems = [
  {
    pattern: 'Pattern 01 / Source',
    eyebrow: 'Recover',
    title: 'Letters, photos, and margin notes become searchable source material.',
    body: 'Every extracted person, place, and date stays tied to the artifact it came from.',
    image: 'recovery' as const,
    symbol: 'recover' as const,
  },
  {
    pattern: 'Pattern 02 / Voice',
    eyebrow: 'Listen',
    title: 'Voice recordings keep cadence, pauses, and translation beside the transcript.',
    body: 'Oral history remains testimony, not just text in a database.',
    image: 'voice' as const,
    symbol: 'listen' as const,
  },
  {
    pattern: 'Pattern 03 / Relation',
    eyebrow: 'Trace',
    title: 'Family lines resolve as evidence you can check, update, and pass on.',
    body: 'Relationships are visible without losing the source trail behind them.',
    image: 'lineage' as const,
    symbol: 'trace' as const,
  },
]

const reveal = {
  hidden: { opacity: 0, transform: 'translateY(18px)' },
  show: { opacity: 1, transform: 'translateY(0)' },
}

function CompassGlyph({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3L15.5 10.5L21 12L15.5 13.5L12 21L8.5 13.5L3 12L8.5 10.5L12 3Z" />
      <path d="M12 9V15" />
      <path d="M9 12H15" />
    </svg>
  )
}

function MicroSymbol({ kind, className = '' }: { kind: SymbolKind; className?: string }) {
  const common = {
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.35,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    className,
    'aria-hidden': true,
  }

  if (kind === 'recover') {
    return (
      <svg {...common}>
        <path d="M3 3.5H13V12.5H3Z" />
        <path d="M5 6H11" />
        <path d="M5 8H10" />
        <path d="M5 10H8" />
      </svg>
    )
  }

  if (kind === 'listen') {
    return (
      <svg {...common}>
        <path d="M3 9V7" />
        <path d="M5.5 11V5" />
        <path d="M8 12V4" />
        <path d="M10.5 10V6" />
        <path d="M13 9V7" />
      </svg>
    )
  }

  if (kind === 'trace') {
    return (
      <svg {...common}>
        <path d="M8 2.5V5.5" />
        <path d="M4 9L8 5.5L12 9" />
        <path d="M4 9V13" />
        <path d="M12 9V13" />
        <path d="M2.5 13H5.5" />
        <path d="M10.5 13H13.5" />
      </svg>
    )
  }

  if (kind === 'share') {
    return (
      <svg {...common}>
        <path d="M3 8H12" />
        <path d="M9 5L12 8L9 11" />
        <path d="M3 4H6" />
        <path d="M3 12H6" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M3 4H13" />
      <path d="M3 8H13" />
      <path d="M3 12H9" />
    </svg>
  )
}

function ArchiveImage({
  kind,
  priority = false,
  className = '',
  sizes = '(min-width: 1024px) 50vw, 100vw',
}: {
  kind: ArtworkKind
  priority?: boolean
  className?: string
  sizes?: string
}) {
  const asset = archiveIllustrations[kind]

  return (
    <div
      className={`landing-art ${className}`}
      style={{ backgroundImage: `url(${asset.src})` }}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        width={1536}
        height={1024}
        priority={priority}
        sizes={sizes}
        className="landing-art__image"
      />
      <div className="landing-art__scanlines" aria-hidden="true" />
    </div>
  )
}

function LandingNav() {
  return (
    <nav
      className="landing-nav absolute left-6 right-6 top-6 z-10 grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[rgba(238,220,184,0.16)] pb-4 md:left-10 md:right-10 md:grid-cols-[1fr_auto_1fr]"
      aria-label="Primary"
    >
      <Link href="/" className="landing-wordmark w-fit font-serif text-2xl text-[var(--archive-text)] no-underline" translate="no">
        Whakapapa
      </Link>
      <div className="landing-nav__links hidden items-center gap-8 md:flex">
        <a href="#how-it-works">How It Works</a>
        <a href="#share">Share</a>
        <a href="https://github.com/maxwellyoung/whakapapa" target="_blank" rel="noopener noreferrer">
          Source
        </a>
      </div>
      <Link href="/login" className="landing-nav__action justify-self-end">
        Sign In
      </Link>
    </nav>
  )
}

function Hero() {
  const reduceMotion = useReducedMotion()

  return (
    <header
      className="landing-hero relative grid min-h-screen overflow-hidden px-6 pb-10 pt-28 md:px-10 md:pt-32"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(8, 12, 18, 0.96) 0%, rgba(8, 12, 18, 0.78) 36%, rgba(8, 12, 18, 0.16) 76%), linear-gradient(180deg, rgba(15, 29, 43, 0.62), rgba(18, 52, 79, 0.12) 42%, rgba(8, 12, 18, 0.9)), url("/landing/hero-artifact-web.png")',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <LandingNav />
      <div className="landing-hero__grid" aria-hidden="true" />

      <motion.div
        variants={reduceMotion ? undefined : reveal}
        initial={reduceMotion ? undefined : 'hidden'}
        animate={reduceMotion ? undefined : 'show'}
        transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
        className="landing-hero__copy relative z-[2] w-full max-w-3xl self-end"
      >
        <p className="landing-kicker">
          <CompassGlyph className="size-4" />
          Family memory, source intact
        </p>
        <h1 className="max-w-[9.5ch] font-serif text-[clamp(4.3rem,11vw,10.5rem)] leading-[0.82] tracking-[-0.055em] text-[var(--archive-text)] text-balance">
          Keep the story close enough to feel.
        </h1>
        <p className="mt-6 max-w-xl text-[clamp(1rem,1.5vw,1.25rem)] leading-relaxed text-[var(--archive-text)]">
          Whakapapa turns letters, voices, photos, and family lines into a living archive your whānau can trust.
        </p>
        <div className="landing-actions mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="landing-button landing-button--primary inline-flex min-h-12 items-center justify-center border border-[var(--accent)] bg-[rgba(203,153,79,0.17)] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--archive-text)] no-underline"
          >
            Begin Preserving
          </Link>
          <a
            href="#how-it-works"
            className="landing-button landing-button--secondary inline-flex min-h-12 items-center justify-center border border-[rgba(238,220,184,0.22)] bg-[rgba(5,7,9,0.22)] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--archive-text)] no-underline"
          >
            See How
          </a>
        </div>
      </motion.div>

      <div className="landing-hero__caption absolute bottom-8 right-8 z-[2] hidden gap-4 text-xs uppercase tracking-[0.18em] text-[rgba(238,220,184,0.66)] md:flex" aria-hidden="true">
        <span>Recovered letter scene</span>
        <span>Aotearoa New Zealand</span>
      </div>
    </header>
  )
}

function ProofSection() {
  const reduceMotion = useReducedMotion()

  return (
    <section id="how-it-works" className="landing-section landing-section--proof px-6 py-24 md:px-10 md:py-32">
      <div className="landing-section__intro mx-auto mb-12 grid max-w-7xl gap-8 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
        <p className="landing-kicker">How It Works</p>
        <h2 className="max-w-[11ch] font-serif text-[clamp(3rem,7vw,6.5rem)] leading-[0.88] tracking-[-0.055em] text-[var(--archive-text)] text-balance">
          One archive. Three kinds of memory.
        </h2>
      </div>

      <div className="landing-proof-grid mx-auto grid max-w-7xl gap-px bg-[rgba(238,220,184,0.14)]">
        {proofItems.map((item, index) => (
          <motion.article
            key={item.eyebrow}
            className="landing-proof grid bg-[rgba(8,10,12,0.98)] md:min-h-[24rem] md:grid-cols-[minmax(18rem,0.74fr)_minmax(0,1fr)]"
            initial={false}
            whileInView={reduceMotion ? undefined : { y: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.46, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
          >
            <ArchiveImage
              kind={item.image}
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="landing-proof__image min-h-[18rem] rounded-none border-0 md:h-full md:min-h-[24rem]"
            />
            <div className="landing-proof__copy flex flex-col justify-center p-6 md:p-12 lg:p-16">
              <span className="landing-proof__pattern">{item.pattern}</span>
              <p className="inline-flex items-center gap-3">
                <MicroSymbol kind={item.symbol} className="size-4" />
                {item.eyebrow}
              </p>
              <h3 className="max-w-[18ch] font-serif text-[clamp(2.1rem,4vw,4.2rem)] leading-[0.94] tracking-[-0.045em] text-[var(--archive-text)] text-balance">
                {item.title}
              </h3>
              <span>{item.body}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

function ShareSection() {
  return (
    <section id="share" className="landing-section landing-share grid min-h-[82svh] items-center gap-10 border-t border-[rgba(238,220,184,0.12)] px-6 py-24 md:grid-cols-[0.92fr_1.08fr] md:px-10 md:py-32 lg:gap-20">
      <div className="landing-share__copy max-w-2xl">
        <p className="landing-kicker">Pass It On</p>
        <h2 className="max-w-[11ch] font-serif text-[clamp(3rem,7vw,6.5rem)] leading-[0.88] tracking-[-0.055em] text-[var(--archive-text)] text-balance">
          Send memory forward without thinning it out.
        </h2>
        <p className="mt-6 max-w-xl leading-relaxed text-[var(--archive-muted)]">
          Share a person, source, or story with context attached: who said it, where it came from, and how it belongs
          in the line.
        </p>
        <Link
          href="/login"
          className="landing-button landing-button--primary inline-flex min-h-12 items-center justify-center border border-[var(--accent)] bg-[rgba(203,153,79,0.17)] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--archive-text)] no-underline"
        >
          Start Your Archive
        </Link>
      </div>

      <div className="landing-share__image">
        <ArchiveImage kind="transmission" sizes="(min-width: 1024px) 44vw, 100vw" />
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer className="landing-footer flex flex-col gap-4 border-t border-[rgba(238,220,184,0.12)] px-6 py-6 text-xs uppercase tracking-[0.16em] text-[var(--archive-muted)] md:flex-row md:items-center md:justify-between md:px-10">
      <span>Crafted in Aotearoa New Zealand</span>
      <a href="https://github.com/maxwellyoung/whakapapa" target="_blank" rel="noopener noreferrer">
        <Github className="size-4" aria-hidden="true" />
        Open Source
      </a>
    </footer>
  )
}

export function LandingPage() {
  return (
    <main className="landing-page">
      <Hero />
      <ProofSection />
      <ShareSection />
      <LandingFooter />
    </main>
  )
}
