'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Spring configs inspired by Emil Kowalski
// Purposeful, fast, alive. Never decorative.
const springs = {
  gentle: { type: 'spring' as const, stiffness: 400, damping: 40 },
  wobbly: { type: 'spring' as const, stiffness: 300, damping: 20 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 30 },
  slow: { type: 'spring' as const, stiffness: 120, damping: 40 },
}

interface SpringFadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function SpringFadeIn({ children, delay = 0, className }: SpringFadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...springs.gentle,
        delay: delay / 1000
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface SpringScaleInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function SpringScaleIn({ children, delay = 0, className }: SpringScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        ...springs.wobbly,
        delay: delay / 1000
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggeredChildrenProps {
  children: ReactNode[]
  staggerDelay?: number
  className?: string
}

export function StaggeredChildren({ 
  children, 
  staggerDelay = 100, 
  className 
}: StaggeredChildrenProps) {
  return (
    <motion.div 
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay / 1000
          }
        }
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={springs.gentle}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

interface SlideTransitionProps {
  show: boolean
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

const directionMap = {
  up: { y: '100%' },
  down: { y: '-100%' },
  left: { x: '100%' },
  right: { x: '-100%' },
}

export function SlideTransition({ 
  show, 
  children, 
  direction = 'up', 
  className 
}: SlideTransitionProps) {
  const offset = directionMap[direction]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, ...offset }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, ...offset }}
          transition={springs.gentle}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface FloatingElementProps {
  children: ReactNode
  intensity?: number
  className?: string
}

export function FloatingElement({ 
  children, 
  intensity = 10, 
  className 
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{ y: [-intensity / 2, intensity / 2, -intensity / 2] }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface PulseProps {
  children: ReactNode
  scale?: number
  className?: string
}

export function Pulse({ 
  children, 
  scale = 1.05, 
  className 
}: PulseProps) {
  return (
    <motion.div
      animate={{ 
        scale: [1, scale, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface SpringNumberProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
}

export function SpringNumber({ value, className, prefix = '', suffix = '' }: SpringNumberProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {prefix}{value}{suffix}
    </motion.span>
  )
}

// Specialized for whakapapa. Represents the growing family tree.
interface GrowingTreeProps {
  nodeCount: number
  className?: string
}

export function GrowingTree({ nodeCount, className }: GrowingTreeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={springs.wobbly}
      className={className}
    >
      <div className="flex items-center gap-3">
        <FloatingElement intensity={8}>
          <div className="text-4xl">🌿</div>
        </FloatingElement>
        <div className="text-sm text-muted-foreground">
          <motion.span 
            className="font-medium text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {nodeCount}
          </motion.span>
          <span> family {nodeCount === 1 ? 'member' : 'members'}</span>
        </div>
      </div>
    </motion.div>
  )
}
