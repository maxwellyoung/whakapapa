'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, FileText, GitBranch, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WelcomeDialogProps {
  open: boolean
  onClose: () => void
  workspaceName: string
}

const steps = [
  {
    icon: Users,
    title: 'Add People',
    description: 'Start by adding family members. Include names, dates, and places.',
  },
  {
    icon: GitBranch,
    title: 'Connect Relationships',
    description: 'Link people together as parents, children, spouses, and siblings.',
  },
  {
    icon: FileText,
    title: 'Attach Sources',
    description: 'Upload photos, documents, and notes. Cite sources for every claim.',
  },
  {
    icon: Sparkles,
    title: 'Use AI to Help',
    description: 'Paste text from documents and let AI extract names, dates, and places.',
  },
]

export function WelcomeDialog({ open, onClose, workspaceName }: WelcomeDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onClose()
      router.push('/people/new')
    }
  }

  const currentStep = steps[step]
  const Icon = currentStep.icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 0 ? `Welcome to ${workspaceName}!` : currentStep.title}
          </DialogTitle>
          <DialogDescription>
            {step === 0
              ? "Let's get your family tree started. Here's what you can do:"
              : currentStep.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 0 ? (
            <div className="space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
                <Icon className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground">{currentStep.description}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i <= step ? 'bg-neutral-900 dark:bg-neutral-100' : 'bg-neutral-200 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {step < steps.length - 1 ? (
              'Next'
            ) : (
              <>
                Add first person
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
