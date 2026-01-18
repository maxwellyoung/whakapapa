'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).trim()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      // Provide more specific error messages
      let errorText = error.message
      if (error.message.includes('rate limit')) {
        errorText = 'Too many sign-in attempts. Please wait a few minutes and try again.'
      } else if (error.message.includes('Database error')) {
        errorText = 'Something went wrong setting up your account. Please try again.'
      } else if (error.message.includes('Invalid email')) {
        errorText = 'Please check that your email address is correct.'
      }
      setMessage({ type: 'error', text: errorText })
    } else {
      setMessage({
        type: 'success',
        text: "We've sent you a sign-in link. Check your inbox (and spam folder) for an email from us.",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Whakapapa</CardTitle>
        <CardDescription>
          Your family history, preserved and connected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll email you a secure sign-in link. No password needed.
            </p>
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Email me a sign-in link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
