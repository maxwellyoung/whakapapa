'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

// OAuth provider icons
function GoogleIcon({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [processingLink, setProcessingLink] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const getSafeNext = () => {
    if (typeof window === 'undefined') return '/'
    const requestedNext = new URLSearchParams(window.location.search).get('next')
    return requestedNext && requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/'
  }

  useEffect(() => {
    async function completeHashAuth() {
      if (typeof window === 'undefined') return

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (!accessToken || !refreshToken) {
        return
      }

      setProcessingLink(true)
      setMessage(null)

      const supabase = createClient()
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        setMessage({
          type: 'error',
          text: 'This sign-in link is invalid or has expired. Please request a new one.',
        })
        setProcessingLink(false)
        return
      }

      const safeNext = getSafeNext()
      window.history.replaceState(null, '', safeNext)
      router.replace(safeNext)
    }

    completeHashAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const supabase = createClient()

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).trim()
    const callbackUrl = new URL('/auth/callback', baseUrl)
    const safeNext = getSafeNext()
    if (safeNext !== '/') {
      callbackUrl.searchParams.set('next', safeNext)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    })

    setLoading(false)

    if (error) {
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

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    setOauthLoading(provider)
    setMessage(null)

    const supabase = createClient()
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).trim()

    const callbackUrl = new URL('/auth/callback', baseUrl)
    const safeNext = getSafeNext()
    if (safeNext !== '/') {
      callbackUrl.searchParams.set('next', safeNext)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })

    if (error) {
      setMessage({
        type: 'error',
        text: `Couldn't sign in with ${provider}. Please try again or use email instead.`,
      })
      setOauthLoading(null)
    }
    // If successful, the page will redirect to the provider
  }

  return (
    <section className="auth-panel w-full" aria-labelledby="login-title">
      <div className="auth-panel__header">
        <p className="auth-panel__eyebrow">Secure Archive Access</p>
        <h1 id="login-title" className="auth-panel__title" translate="no">
          Whakapapa
        </h1>
        <p className="auth-panel__description">
          Preserve family history with source, voice, and context intact.
        </p>
      </div>

      <div className="auth-panel__body">
        {/* OAuth Buttons */}
        <div className="grid gap-2">
          <Button
            variant="outline"
            onClick={() => handleOAuthLogin('google')}
            disabled={oauthLoading !== null}
            className="auth-button auth-button--oauth w-full"
          >
            {oauthLoading === 'google' ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[rgba(237,203,136,0.26)] border-t-[var(--image-paper)]" aria-hidden="true" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            )}
            Continue with Google
          </Button>
          {/* <Button
            variant="outline"
            onClick={() => handleOAuthLogin('facebook')}
            disabled={oauthLoading !== null}
            className="w-full"
          >
            {oauthLoading === 'facebook' ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            ) : (
              <FacebookIcon className="mr-2 h-5 w-5 text-[#1877F2]" />
            )}
            Continue with Facebook
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthLogin('apple')}
            disabled={oauthLoading !== null}
            className="w-full"
          >
            {oauthLoading === 'apple' ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            ) : (
              <AppleIcon className="mr-2 h-5 w-5" />
            )}
            Continue with Apple
          </Button> */}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-[rgba(237,203,136,0.16)]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[var(--archive-bg)] px-3 text-[rgba(238,220,184,0.62)]">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="auth-label">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              placeholder="you@example.com…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || oauthLoading !== null}
              className="auth-input"
            />
            <p className="text-xs leading-5 text-[rgba(238,220,184,0.62)]">
              We&apos;ll email you a secure sign-in link. No password needed.
            </p>
          </div>

          {message && (
            <div
              role={message.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={`rounded-xl border p-3 text-sm leading-6 ${
                message.type === 'success'
                  ? 'border-[rgba(93,141,123,0.3)] bg-[rgba(93,141,123,0.14)] text-[var(--image-paper)]'
                  : 'border-[rgba(150,103,56,0.36)] bg-[rgba(150,103,56,0.16)] text-[var(--image-paper)]'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            className="auth-button auth-button--primary w-full"
            disabled={loading || oauthLoading !== null || processingLink}
          >
            {processingLink ? 'Signing You In…' : loading ? 'Sending…' : 'Email Me a Sign-In Link'}
          </Button>
        </form>
      </div>
    </section>
  )
}
