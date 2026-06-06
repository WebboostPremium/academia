import { redirect } from 'next/navigation'
import { getCurrentUser, roleHome } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export default async function RedirectPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  redirect(roleHome(user.role))
}
