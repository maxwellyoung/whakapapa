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
    setHasBeenShown(true)
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
            className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-xl"
          >
            <div className="relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAcknowledge}
                className="absolute right-4 top-4 z-10 h-8 w-8 rounded-full bg-muted/50 hover:bg-muted backdrop-blur-sm"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Header with gradient */}
              <div className="relative overflow-hidden rounded-t-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-blue-500/10" />
                <div className="relative px-8 pt-8 pb-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="mb-4 text-6xl">🌿</div>
                    <h1 className="text-2xl font-serif font-medium text-foreground mb-2">
                      Tēnā koutou katoa
                    </h1>
                    <p className="text-muted-foreground text-sm">
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
                    <p className="text-muted-foreground">
                      We acknowledge that the word <em>whakapapa</em> carries deep cultural significance 
                      in te ao Māori. It represents far more than genealogy. It embodies the sacred 
                      connections between all living things, the stories that flow through generations, 
                      and the responsibility we have to honor those who came before us.
                    </p>

                    <p className="text-muted-foreground">
                      This application is designed to serve families from all backgrounds who wish to 
                      preserve their ancestral stories. We use the term <em>whakapapa</em> with deep 
                      respect for its origins and the wisdom it represents.
                    </p>
                  </div>

                  <div className="border-l-2 border-accent/30 pl-4 py-2 bg-muted/30 rounded-r-lg">
                    <p className="text-xs text-muted-foreground italic">
                      "Ko au ko koe, ko koe ko au"<br />
                      <span className="text-xs">I am you, and you are me. We are all connected</span>
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-4">
                      May this space honor the memories and stories of your whānau
                    </p>
                    
                    <Button
                      onClick={handleAcknowledge}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-2 rounded-full transition-spring"
                    >
                      Kia ora, let's begin
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