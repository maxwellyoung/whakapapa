'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface SharePasswordGateProps {
  token: string
  initialError?: string
}

export function SharePasswordGate({ token, initialError }: SharePasswordGateProps) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/share/${token}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        if (response.status === 429) {
          setError('Too many attempts. Please wait a minute and try again.')
        } else if (response.status === 503) {
          setError('This share link is temporarily unavailable. Please contact the person who shared it.')
        } else {
          setError('Incorrect password. Please try again.')
        }
        return
      }

      window.location.reload()
    } catch {
      setError('Unable to verify password right now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="archive-public-shell flex min-h-screen items-center justify-center px-4">
      <div className="archive-artifact w-full max-w-sm p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="archive-memory-badge h-10 w-10">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-[-0.035em] text-[var(--archive-text)]">
              Password Required
            </h1>
            <p className="text-sm text-[rgba(238,220,184,0.62)]">
              Enter the share password to continue.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="share-password"
            name="share-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Share password…"
            autoComplete="current-password"
            disabled={submitting}
            className="auth-input"
          />
          {error && (
            <p role="alert" className="rounded-xl border border-[rgba(150,103,56,0.36)] bg-[rgba(150,103,56,0.16)] p-3 text-sm text-[var(--image-paper)]">{error}</p>
          )}
          <Button className="auth-button auth-button--primary w-full" type="submit" disabled={submitting || !password.trim()}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Verifying…
              </>
            ) : (
              'Unlock'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
