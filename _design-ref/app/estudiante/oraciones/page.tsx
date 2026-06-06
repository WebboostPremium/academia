import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/session'
import { getPrayers, getPrayerProgress } from '@/lib/services/server-data'
import { SectionHeader } from '@/components/dashboard/ui'
import { PrayerList } from '@/components/estudiante/prayer-list'

export const dynamic = 'force-dynamic'

export default async function OracionesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [prayers, progress] = await Promise.all([
    getPrayers(),
    getPrayerProgress(user.uid),
  ])
  const learnedIds = progress.filter((p) => p.learned).map((p) => p.prayerId)

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Mis oraciones"
        description="Memoriza las oraciones esenciales a tu propio ritmo."
      />
      <PrayerList prayers={prayers} learnedIds={learnedIds} />
    </div>
  )
}
