import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_invite_by_token', {
    invite_token: token,
  })

  if (error || !data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
