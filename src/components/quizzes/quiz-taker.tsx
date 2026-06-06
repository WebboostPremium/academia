"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Quiz } from "@/types/course";
import { gradeQuiz } from "@/lib/services/quizzes";

interface QuizTakerProps {
  quiz: Quiz;
  onSubmit: (answers: Record<string, string>, result: { score: number; passed: boolean }) => Promise<void>;
}

const TYPE_LABELS = {
  multiple_choice: "Opción múltiple",
  single_choice: "Respuesta única",
  true_false: "Verdadero / Falso",
};

export function QuizTaker({ quiz, onSubmit }: QuizTakerProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; graded: ReturnType<typeof gradeQuiz>["graded"] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const graded = gradeQuiz(quiz, answers);
    setResult(graded);
    setSubmitted(true);
    await onSubmit(answers, { score: graded.score, passed: graded.passed });
    setLoading(false);
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{quiz.title}</h2>
      {quiz.description && <p className="text-muted-foreground">{quiz.description}</p>}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>Nota mínima: {quiz.passingScore}%</span>
        <span>·</span>
        <span>Intentos máx: {quiz.maxAttempts}</span>
        {quiz.timeLimitMinutes && <><span>·</span><span>Tiempo: {quiz.timeLimitMinutes} min</span></>}
      </div>
      {quiz.questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {i + 1}. {q.text}
              <span className="ml-2 text-xs font-normal text-muted-foreground">({TYPE_LABELS[q.type] ?? q.type})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt) => {
              const selected = answers[q.id] === opt.id;
              const showResult = submitted && result;
              const isCorrect = opt.isCorrect;
              return (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  } ${showResult && isCorrect ? "border-green-500 bg-green-50" : ""}
                  ${showResult && selected && !isCorrect ? "border-destructive bg-destructive/5" : ""}`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.id}
                    checked={selected}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt.id }))}
                    disabled={submitted}
                    className="accent-primary"
                  />
                  <span>{opt.text}</span>
                </label>
              );
            })}
            {q.explanation && submitted && result && (
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            )}
          </CardContent>
        </Card>
      ))}
      {!submitted ? (
        <Button onClick={handleSubmit} disabled={loading || !allAnswered}>
          {loading ? "Enviando..." : "Enviar respuestas"}
        </Button>
      ) : result && (
        <Card className={result.passed ? "border-green-500 bg-green-50" : "border-destructive bg-destructive/5"}>
          <CardContent className="py-4">
            <p className="font-semibold">
              {result.passed ? "¡Aprobado!" : "No aprobado"} — {result.score}%
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
