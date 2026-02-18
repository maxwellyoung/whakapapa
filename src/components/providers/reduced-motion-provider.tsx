'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Wraps the app with Framer Motion's MotionConfig to respect
 * the user's prefers-reduced-motion OS setting (WCAG 2.3.3).
 *
 * When reducedMotion="user", Framer Motion reads the
 * prefers-reduced-motion media query and replaces all animations
 * with instant state changes for users who have opted out of motion.
 */
export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
