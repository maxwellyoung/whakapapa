'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoleLabel } from '@/lib/permissions'
import type { UserRole } from '@/types'

interface InviteInfo {
  workspace_name: string
  role: UserRole
  expired: boolean
  used: boolean
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)

  useEffect(() => {
    async function checkInvite() {
      const supabase = createClient()

      // Check if user is logged in
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser({ email: authUser.email ?? '' })
      }

      // Fetch invite info
      const { data, error: fetchError } = await supabase
        .from('invites')
        .select(`
          role,
          expires_at,
          used_at,
          workspaces (name)
        `)
        .eq('token', token)
        .single()

      setLoading(false)

      if (fetchError || !data) {
        setError('This invite link is invalid or has expired.')
        return
      }

      const workspace = data.workspaces as unknown as { name: string } | null
      const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false
      const isUsed = !!data.used_at

      if (isExpired || isUsed) {
        setError(isUsed ? 'This invite has already been used.' : 'This invite has expired.')
        return
      }

      setInvite({
        workspace_name: workspace?.name ?? 'Unknown workspace',
        role: data.role,
        expired: isExpired,
        used: isUsed,
      })
    }

    checkInvite()
  }, [token])

  const handleRedeem = async () => {
    if (!user) {
      // Redirect to login with next param
      router.push(`/login?next=/invite/${token}`)
      return
    }

    setRedeeming(true)
    setError(null)

    const supabase = createClient()
    const { data, error: redeemError } = await supabase.rpc('redeem_invite', {
      invite_token: token,
    })

    setRedeeming(false)

    if (redeemError) {
      setError(redeemError.message)
      return
    }

    if (data?.success) {
      router.push('/')
    } else {
      setError(data?.error ?? 'Failed to redeem invite')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading invite...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invite</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push('/login')} variant="outline">
            Go to login
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!invite) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {invite.workspace_name}</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join as {getRoleLabel(invite.role).toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
            <Button onClick={handleRedeem} className="w-full" disabled={redeeming}>
              {redeeming ? 'Joining...' : 'Accept invite'}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in to accept this invite
            </p>
            <Button onClick={handleRedeem} className="w-full">
              Sign in to continue
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
