import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // User is logged in, redirect to dashboard
    redirect('/people')
  } else {
    // Not logged in, redirect to login
    redirect('/login')
  }
}
