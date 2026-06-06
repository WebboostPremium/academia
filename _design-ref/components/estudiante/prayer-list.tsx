'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Circle, HeartHandshake } from 'lucide-react'
import { toast } from 'sonner'
import type { Prayer } from '@/types'
import { togglePrayerLearned } from '@/lib/actions/student'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export function PrayerList({
  prayers,
  learnedIds,
}: {
  prayers: Prayer[]
  learnedIds: string[]
}) {
  const [learned, setLearned] = useState<Set<string>>(new Set(learnedIds))
  const [, startTransition] = useTransition()

  const pct =
    prayers.length === 0
      ? 0
      : Math.round((learned.size / prayers.length) * 100)

  function toggle(prayer: Prayer) {
    const isDone = learned.has(prayer.id)
    const next = new Set(learned)
    if (isDone) next.delete(prayer.id)
    else next.add(prayer.id)
    setLearned(next)
    startTransition(async () => {
      const res = await togglePrayerLearned(prayer.id, !isDone)
      if (res.error) {
        toast.error(res.error)
        setLearned(learned)
      } else if (!isDone) {
        toast.success(`Marcaste "${prayer.title}" como aprendida`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <HeartHandshake className="size-5 text-primary" />
          <h3 className="font-medium">Tu progreso de oraciones</h3>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={pct} />
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {learned.size}/{prayers.length}
          </span>
        </div>
      </Card>

      {prayers.length === 0 ? (
        <p className="text-muted-foreground">
          Aún no hay oraciones registradas.
        </p>
      ) : (
        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {prayers.map((prayer) => {
            const isDone = learned.has(prayer.id)
            return (
              <Card key={prayer.id} className="overflow-hidden p-0">
                <AccordionItem value={prayer.id} className="border-0">
                  <div className="flex items-center gap-3 px-5">
                    <button
                      onClick={() => toggle(prayer)}
                      aria-label={
                        isDone ? 'Marcar como no aprendida' : 'Marcar como aprendida'
                      }
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-5 text-primary" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </button>
                    <AccordionTrigger className="flex-1 py-4 font-serif text-base font-semibold hover:no-underline">
                      {prayer.title}
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="px-5 pb-5">
                    <p className="whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">
                      {prayer.content}
                    </p>
                    <Button
                      variant={isDone ? 'secondary' : 'default'}
                      size="sm"
                      className="mt-4"
                      onClick={() => toggle(prayer)}
                    >
                      {isDone ? 'Aprendida' : 'Marcar como aprendida'}
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            )
          })}
        </Accordion>
      )}
    </div>
  )
}
