'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

// Kowalski-inspired motion grammar: animations communicate, not decorate
// Each variant has semantic meaning

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export const slideIn = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
}

export const scale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
}

export const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

// Purposeful easing - not bouncy, not mechanical
export const ease = [0.25, 0.1, 0.25, 1] as const // cubic-bezier
export const gentleSpring = { type: 'spring', stiffness: 300, damping: 30 }

// Page transition wrapper
export const PageTransition = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { children: React.ReactNode }
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    {...props}
  >
    {children}
  </motion.div>
))
PageTransition.displayName = 'PageTransition'

// List item animation
export const ListItem = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { children: React.ReactNode }
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    variants={slideUp}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    {...props}
  >
    {children}
  </motion.div>
))
ListItem.displayName = 'ListItem'

// Staggered list container
export const StaggerContainer = forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'> & { children: React.ReactNode }
>(({ children, ...props }, ref) => (
  <motion.div
    ref={ref}
    variants={stagger}
    initial="initial"
    animate="animate"
    {...props}
  >
    {children}
  </motion.div>
))
StaggerContainer.displayName = 'StaggerContainer'

// Presence animation for conditional rendering
export { AnimatePresence } from 'framer-motion'
