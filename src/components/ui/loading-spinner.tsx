'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const dots = Array.from({ length: 3 }, (_, i) => (
    <motion.div
      key={i}
      className="h-2 w-2 bg-accent rounded-full"
      initial={{ scale: 0, opacity: 0.3 }}
      animate={{ 
        scale: [0.6, 1, 0.6], 
        opacity: [0.3, 1, 0.3] 
      }}
      transition={{
        duration: 1.2,
        repeat: Infinity,
        delay: i * 0.2,
        ease: [0.34, 1.56, 0.64, 1]
      }}
    />
  ))

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <motion.div
        className={cn(
          "relative flex items-center justify-center rounded-full border-2 border-border",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-transparent border-t-accent"
          animate={{ rotate: -360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="h-1.5 w-1.5 bg-accent rounded-full"
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: [0.34, 1.56, 0.64, 1]
          }}
        />
      </motion.div>

      {text && (
        <motion.div 
          className="flex items-center gap-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="text-sm text-muted-foreground">{text}</span>
          <div className="flex gap-1">
            {dots}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Alternative minimalist loader
export function PulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className="h-3 w-3 bg-accent rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: [0.34, 1.56, 0.64, 1]
        }}
      />
    </div>
  )
}

// Tree-inspired loading animation
export function TreeLoader({ className }: { className?: string }) {
  return (
    <motion.div 
      className={cn("flex flex-col items-center gap-3", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-4xl"
        animate={{ 
          rotateY: [0, 10, -10, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        🌿
      </motion.div>
      <motion.div
        className="flex gap-1"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: 0.2,
              repeat: Infinity,
              repeatDelay: 1
            }
          }
        }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 bg-accent rounded-full"
            variants={{
              hidden: { opacity: 0.3, scale: 0.8 },
              show: { 
                opacity: 1, 
                scale: 1,
                transition: { type: 'spring', stiffness: 400, damping: 25 }
              }
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  )
}