'use client'

import { ReactNode } from 'react'
import { useSpring, animated, useTransition, config } from '@react-spring/web'

interface SpringFadeInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function SpringFadeIn({ children, delay = 0, className }: SpringFadeInProps) {
  const styles = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    delay,
    config: { ...config.gentle, tension: 400, friction: 40 }
  })

  return (
    <animated.div style={styles} className={className}>
      {children}
    </animated.div>
  )
}

interface SpringScaleInProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function SpringScaleIn({ children, delay = 0, className }: SpringScaleInProps) {
  const styles = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    delay,
    config: { ...config.wobbly, tension: 300 }
  })

  return (
    <animated.div style={styles} className={className}>
      {children}
    </animated.div>
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
    <div className={className}>
      {children.map((child, index) => (
        <SpringFadeIn key={index} delay={index * staggerDelay}>
          {child}
        </SpringFadeIn>
      ))}
    </div>
  )
}

interface SlideTransitionProps {
  show: boolean
  children: ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}

export function SlideTransition({ 
  show, 
  children, 
  direction = 'up', 
  className 
}: SlideTransitionProps) {
  const getTransform = (direction: string) => {
    switch (direction) {
      case 'up': return 'translateY(100%)'
      case 'down': return 'translateY(-100%)'
      case 'left': return 'translateX(100%)'
      case 'right': return 'translateX(-100%)'
      default: return 'translateY(100%)'
    }
  }

  const transitions = useTransition(show, {
    from: { opacity: 0, transform: getTransform(direction) },
    enter: { opacity: 1, transform: 'translate(0%)' },
    leave: { opacity: 0, transform: getTransform(direction) },
    config: { ...config.gentle, tension: 400, friction: 40 }
  })

  return transitions(
    (styles, item) =>
      item && (
        <animated.div style={styles} className={className}>
          {children}
        </animated.div>
      )
  )
}

interface FloatingElementProps {
  children: ReactNode
  intensity?: number
  speed?: number
  className?: string
}

export function FloatingElement({ 
  children, 
  intensity = 10, 
  speed = 3000,
  className 
}: FloatingElementProps) {
  const styles = useSpring({
    from: { transform: 'translateY(0px)' },
    to: async (next) => {
      while (true) {
        await next({ transform: `translateY(-${intensity}px)` })
        await next({ transform: 'translateY(0px)' })
      }
    },
    config: { tension: 120, friction: 40, duration: speed }
  })

  return (
    <animated.div style={styles} className={className}>
      {children}
    </animated.div>
  )
}

interface PulseProps {
  children: ReactNode
  scale?: number
  speed?: number
  className?: string
}

export function Pulse({ 
  children, 
  scale = 1.05, 
  speed = 2000,
  className 
}: PulseProps) {
  const styles = useSpring({
    from: { transform: 'scale(1)', opacity: 0.7 },
    to: async (next) => {
      while (true) {
        await next({ transform: `scale(${scale})`, opacity: 1 })
        await next({ transform: 'scale(1)', opacity: 0.7 })
      }
    },
    config: { tension: 300, friction: 30, duration: speed }
  })

  return (
    <animated.div style={styles} className={className}>
      {children}
    </animated.div>
  )
}

interface SpringNumberProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
}

export function SpringNumber({ value, className, prefix = '', suffix = '' }: SpringNumberProps) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 200,
    config: config.molasses
  })

  return (
    <animated.span className={className}>
      {prefix}
      {number.to(n => n.toFixed(0))}
      {suffix}
    </animated.span>
  )
}

// Specialized for whakapapa - represents growing family tree
interface GrowingTreeProps {
  nodeCount: number
  className?: string
}

export function GrowingTree({ nodeCount, className }: GrowingTreeProps) {
  const styles = useSpring({
    from: { transform: 'scale(0.8)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
    config: { ...config.wobbly, tension: 200 }
  })

  const countStyles = useSpring({
    from: { number: 0 },
    number: nodeCount,
    delay: 400,
    config: config.molasses
  })

  return (
    <animated.div style={styles} className={className}>
      <div className="flex items-center gap-3">
        <FloatingElement intensity={8} speed={4000}>
          <div className="text-4xl">🌿</div>
        </FloatingElement>
        <div className="text-sm text-muted-foreground">
          <animated.span className="font-medium text-foreground">
            {countStyles.number.to(n => n.toFixed(0))}
          </animated.span>
          <span> family {nodeCount === 1 ? 'member' : 'members'}</span>
        </div>
      </div>
    </animated.div>
  )
}