import { redirect } from 'next/navigation'
import { getCurrentUser, roleHome } from '@/lib/auth/session'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'

export const dynamic = 'force-dynamic'

export default async function CatequistaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'catequista') redirect(roleHome(user.role))

  return (
    <DashboardShell user={user} title="Panel del catequista">
      {children}
    </DashboardShell>
  )
}
