'use client'

import { useState, useTransition } from 'react'
import {
  CheckCircle2,
  Circle,
  FileDown,
  PlayCircle,
  ClipboardList,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import type {
  Course,
  Module,
  Lesson,
  Quiz,
  Assignment,
  Submission,
  QuizResult,
} from '@/types'
import {
  toggleLessonComplete,
  submitQuiz,
  submitAssignment,
} from '@/lib/actions/student'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  course: Course
  modules: Module[]
  lessons: Lesson[]
  quizzes: Quiz[]
  assignments: Assignment[]
  completedLessonIds: string[]
  submissions: Submission[]
  quizResults: QuizResult[]
}

export function CourseView({
  course,
  modules,
  lessons,
  quizzes,
  assignments,
  completedLessonIds,
  submissions,
  quizResults,
}: Props) {
  const [completed, setCompleted] = useState<Set<string>>(
    new Set(completedLessonIds),
  )
  const firstLesson = lessons[0] ?? null
  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    firstLesson?.id ?? null,
  )
  const [isPending, startTransition] = useTransition()

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? null
  const pct =
    lessons.length === 0
      ? 0
      : Math.round((completed.size / lessons.length) * 100)

  const lessonQuiz = activeLesson
    ? quizzes.find((q) => q.lessonId === activeLesson.id)
    : null
  const lessonAssignments = activeLesson
    ? assignments.filter((a) => a.lessonId === activeLesson.id)
    : []

  function handleToggle(lesson: Lesson) {
    const isDone = completed.has(lesson.id)
    const next = new Set(completed)
    if (isDone) next.delete(lesson.id)
    else next.add(lesson.id)
    setCompleted(next)
    startTransition(async () => {
      const res = await toggleLessonComplete(course.id, lesson.id, !isDone)
      if (res.error) {
        toast.error(res.error)
        setCompleted(completed)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          {course.title}
        </h2>
        <div className="flex items-center gap-3">
          <Progress value={pct} className="max-w-xs" />
          <span className="text-sm font-medium text-muted-foreground">
            {pct}% completado
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Player + content */}
        <div className="flex flex-col gap-5">
          {activeLesson ? (
            <>
              <div className="overflow-hidden rounded-xl border border-border bg-black">
                <div className="aspect-video">
                  <iframe
                    key={activeLesson.id}
                    src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeId || extractYoutubeId(activeLesson.youtubeUrl)}`}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="size-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-serif text-xl font-semibold">
                    {activeLesson.title}
                  </h3>
                  <Button
                    variant={
                      completed.has(activeLesson.id) ? 'secondary' : 'default'
                    }
                    onClick={() => handleToggle(activeLesson)}
                    disabled={isPending}
                  >
                    {completed.has(activeLesson.id) ? (
                      <>
                        <CheckCircle2 className="size-4" />
                        Completada
                      </>
                    ) : (
                      <>
                        <Circle className="size-4" />
                        Marcar como vista
                      </>
                    )}
                  </Button>
                </div>
                {activeLesson.description && (
                  <p className="text-pretty leading-relaxed text-muted-foreground">
                    {activeLesson.description}
                  </p>
                )}
                {activeLesson.pdfUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-fit"
                  >
                    <a
                      href={activeLesson.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FileDown className="size-4" />
                      Descargar material (PDF)
                    </a>
                  </Button>
                )}
              </div>

              {lessonQuiz && (
                <QuizCard
                  quiz={lessonQuiz}
                  courseId={course.id}
                  previousResult={quizResults.find(
                    (r) => r.quizId === lessonQuiz.id,
                  )}
                />
              )}

              {lessonAssignments.map((a) => (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  courseId={course.id}
                  submission={submissions.find(
                    (s) => s.assignmentId === a.id,
                  )}
                />
              ))}
            </>
          ) : (
            <Card className="p-10 text-center text-muted-foreground">
              Este curso aún no tiene lecciones disponibles.
            </Card>
          )}
        </div>

        {/* Curriculum */}
        <Card className="h-fit p-4">
          <h3 className="px-2 pb-2 font-medium">Contenido del curso</h3>
          <Accordion
            type="multiple"
            defaultValue={modules.map((m) => m.id)}
            className="w-full"
          >
            {modules.map((mod) => {
              const modLessons = lessons.filter((l) => l.moduleId === mod.id)
              return (
                <AccordionItem key={mod.id} value={mod.id}>
                  <AccordionTrigger className="text-sm">
                    {mod.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="flex flex-col gap-1">
                      {modLessons.map((lesson) => {
                        const isActive = lesson.id === activeLessonId
                        const isDone = completed.has(lesson.id)
                        return (
                          <li key={lesson.id}>
                            <button
                              onClick={() => setActiveLessonId(lesson.id)}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors',
                                isActive
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'hover:bg-muted',
                              )}
                            >
                              {isDone ? (
                                <CheckCircle2 className="size-4 shrink-0 text-primary" />
                              ) : (
                                <PlayCircle className="size-4 shrink-0 text-muted-foreground" />
                              )}
                              <span className="line-clamp-2">
                                {lesson.title}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                      {modLessons.length === 0 && (
                        <li className="px-2 py-1 text-xs text-muted-foreground">
                          Sin lecciones
                        </li>
                      )}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </Card>
      </div>
    </div>
  )
}

function extractYoutubeId(url?: string): string {
  if (!url) return ''
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  )
  return match ? match[1] : url
}

function QuizCard({
  quiz,
  courseId,
  previousResult,
}: {
  quiz: Quiz
  courseId: string
  previousResult?: QuizResult
}) {
  const [answers, setAnswers] = useState<number[]>(
    new Array(quiz.questions.length).fill(-1),
  )
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    score: number
    passed: boolean
  } | null>(previousResult ? { score: previousResult.score, passed: previousResult.passed } : null)

  function handleSubmit() {
    if (answers.some((a) => a === -1)) {
      toast.error('Responde todas las preguntas')
      return
    }
    startTransition(async () => {
      const res = await submitQuiz(quiz.id, courseId, answers)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setResult({ score: res.score!, passed: res.passed! })
      toast[res.passed ? 'success' : 'info'](
        res.passed
          ? `¡Aprobaste con ${res.score}%!`
          : `Obtuviste ${res.score}%. Sigue intentando.`,
      )
    })
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center gap-2">
        <ClipboardList className="size-5 text-primary" />
        <h3 className="font-medium">{quiz.title}</h3>
        {result && (
          <Badge
            variant={result.passed ? 'default' : 'secondary'}
            className="ml-auto"
          >
            {result.passed ? 'Aprobado' : 'Reprobado'} · {result.score}%
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-5">
        {quiz.questions.map((q, qi) => (
          <div key={q.id} className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              {qi + 1}. {q.text}
            </p>
            <RadioGroup
              value={answers[qi] === -1 ? undefined : String(answers[qi])}
              onValueChange={(v) => {
                const next = [...answers]
                next[qi] = Number(v)
                setAnswers(next)
              }}
              className="gap-2"
            >
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <RadioGroupItem value={String(oi)} id={`${q.id}-${oi}`} />
                  <Label
                    htmlFor={`${q.id}-${oi}`}
                    className="font-normal text-muted-foreground"
                  >
                    {opt}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>
      <Button onClick={handleSubmit} disabled={isPending} className="w-fit">
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {result ? 'Reintentar evaluación' : 'Enviar respuestas'}
      </Button>
    </Card>
  )
}

function AssignmentCard({
  assignment,
  courseId,
  submission,
}: {
  assignment: Assignment
  courseId: string
  submission?: Submission
}) {
  const [open, setOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState(submission?.fileUrl ?? '')
  const [fileName, setFileName] = useState(submission?.fileName ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      const res = await submitAssignment(
        assignment.id,
        assignment.title,
        courseId,
        fileUrl,
        fileName,
      )
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Tarea enviada')
      setOpen(false)
    })
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">Tarea: {assignment.title}</h3>
        {submission && (
          <Badge
            variant={
              submission.status === 'calificada' ? 'default' : 'secondary'
            }
            className="capitalize"
          >
            {submission.status}
            {submission.grade != null && ` · ${submission.grade}/100`}
          </Badge>
        )}
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {assignment.instructions}
      </p>
      {submission?.feedback && (
        <p className="rounded-md bg-secondary/60 p-3 text-sm">
          <strong>Comentario del catequista:</strong> {submission.feedback}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-fit">
            {submission ? 'Reemplazar entrega' : 'Subir tarea'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entregar tarea</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fileName">Nombre del archivo</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="mi-tarea.pdf"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fileUrl">Enlace al PDF (Drive, etc.)</Label>
              <Input
                id="fileUrl"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
