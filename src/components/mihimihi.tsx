'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Mihimihi() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenShown, setHasBeenShown] = useState(false)

  useEffect(() => {
    // Check if mihimihi has been acknowledged in this session
    const acknowledged = localStorage.getItem('mihimihi-acknowledged')
    if (!acknowledged) {
      // Show after a brief moment to allow page to settle
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setHasBeenShown(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const handleAcknowledge = () => {
    setIsVisible(false)
    setHasBeenShown(true)
    localStorage.setItem('mihimihi-acknowledged', 'true')
  }

  if (hasBeenShown && !isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,12,18,0.64)] p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 30,
              duration: 0.4 
            }}
            className="archive-tool-panel max-h-[90vh] w-full max-w-2xl overflow-auto"
          >
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAcknowledge}
                className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-[rgba(255,249,238,0.62)] text-[var(--atlas-copy)] backdrop-blur-sm hover:bg-[var(--atlas-accent-soft)] hover:text-[var(--atlas-ink)]"
                aria-label="Close welcome"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>

              {/* Header with source-image colors */}
              <div className="relative overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(93,141,123,0.22),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(203,153,79,0.18),transparent_30%)]" />
                <div className="relative px-8 pt-8 pb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="mb-4 text-6xl">🌿</div>
                    <h1 className="mb-2 font-serif text-2xl font-medium tracking-[-0.035em] text-[var(--atlas-ink)]">
                      Tēnā koutou katoa
                    </h1>
                    <p className="text-sm text-[var(--atlas-copy)]">
                      Welcome to this digital whakapapa space
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 pb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="space-y-6 text-sm leading-relaxed"
                >
                  <div className="space-y-4">
                    <p className="text-[var(--atlas-copy)]">
                      We acknowledge that the word <em>whakapapa</em> carries deep cultural significance 
                      in te ao Māori. It represents far more than genealogy. It embodies the sacred 
                      connections between all living things, the stories that flow through generations, 
                      and the responsibility we have to honor those who came before us.
                    </p>

                    <p className="text-[var(--atlas-copy)]">
                      This application is designed to serve families from all backgrounds who wish to 
                      preserve their ancestral stories. We use the term <em>whakapapa</em> with deep 
                      respect for its origins and the wisdom it represents.
                    </p>
                  </div>

                  <div className="rounded-r-lg border-l-2 border-[rgba(203,153,79,0.38)] bg-[rgba(255,249,238,0.62)] py-2 pl-4">
                    <p className="text-xs italic text-[var(--atlas-copy)]">
                      &ldquo;Ko au ko koe, ko koe ko au&rdquo;<br />
                      <span className="text-xs">I am you, and you are me. We are all connected</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="mb-4 text-xs text-[var(--atlas-muted)]">
                      May this space honor the memories and stories of your whānau
                    </p>
                    
                    <Button
                      onClick={handleAcknowledge}
                      className="rounded-full px-8 py-2 transition-spring"
                    >
                      Kia ora, let&apos;s begin
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
