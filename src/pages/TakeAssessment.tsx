import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Question {
  id: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  position: number;
  skill: string;
}

interface Assessment {
  id: string;
  title: string;
  year: string;
  subject: string;
}

interface Student {
  id: string;
  name: string;
  enrollment_number: string;
  school: string;
  class: string;
}

export default function TakeAssessment() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Step: "select-student" | "taking" | "finished"
  const [step, setStep] = useState<"select-student" | "taking" | "finished">("select-student");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(new Date().toISOString());
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "idle">("idle");

  // Load assessment + questions + students
  useEffect(() => {
    if (!assessmentId) return;
    const load = async () => {
      setLoading(true);
      const [aRes, qRes, sRes] = await Promise.all([
        supabase.from("assessments").select("id, title, year, subject").eq("id", assessmentId).single(),
        supabase.from("assessment_questions").select("*").eq("assessment_id", assessmentId).order("position"),
        supabase.from("students").select("id, name, enrollment_number, school, class").order("name"),
      ]);
      if (aRes.data) setAssessment(aRes.data);
      if (qRes.data) setQuestions(qRes.data);
      if (sRes.data) setStudents(sRes.data);
      setLoading(false);
    };
    load();
  }, [assessmentId]);

  // Auto-save answer to DB
  const autoSaveAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!selectedStudentId || !assessmentId) return;
    setAutoSaveStatus("saving");
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const { error } = await supabase.from("student_responses").upsert({
      student_id: selectedStudentId,
      assessment_id: assessmentId,
      question_id: questionId,
      selected_answer: answer,
      is_correct: answer === question.correct_answer,
    }, { onConflict: "student_id,assessment_id,question_id" });

    if (error) {
      console.error("Auto-save error:", error);
      setAutoSaveStatus("idle");
    } else {
      setAutoSaveStatus("saved");
    }
  }, [selectedStudentId, assessmentId, questions]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    autoSaveAnswer(questionId, answer);
  };

  const handleSubmit = async () => {
    if (!assessmentId || !selectedStudentId) return;
    setSubmitting(true);

    const totalQuestions = questions.length;
    const correctAnswers = questions.filter(q => answers[q.id] === q.correct_answer).length;
    const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    const { error } = await supabase.from("assessment_results").upsert({
      student_id: selectedStudentId,
      assessment_id: assessmentId,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      score_percentage: Math.round(scorePercentage * 100) / 100,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    }, { onConflict: "student_id,assessment_id" });

    if (error) {
      toast.error("Erro ao finalizar avaliação: " + error.message);
      setSubmitting(false);
      return;
    }

    setStep("finished");
    setSubmitting(false);
    toast.success("Avaliação finalizada com sucesso!");
  };

  const answeredCount = questions.filter(q => answers[q.id]).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const currentQuestion = questions[currentIdx];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!assessment) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-lg text-muted-foreground">Avaliação não encontrada</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </AppLayout>
    );
  }

  // Step 1: Select student
  if (step === "select-student") {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">📝 {assessment.title}</h1>
              <p className="text-muted-foreground text-sm">{assessment.year} · {assessment.subject}</p>
            </div>
          </div>

          <Card className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Identificação do Aluno</h2>
              <p className="text-muted-foreground text-sm">Selecione o aluno que realizará esta avaliação</p>
            </div>

            <div className="space-y-4">
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — Mat: {s.enrollment_number} {s.class && `· ${s.class}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {students.length === 0 && (
                <p className="text-sm text-destructive text-center">Nenhum aluno cadastrado. Cadastre alunos no Módulo do Aluno primeiro.</p>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="text-sm text-muted-foreground"><strong>Avaliação:</strong> {assessment.title}</p>
                <p className="text-sm text-muted-foreground"><strong>Questões:</strong> {questions.length}</p>
                <p className="text-sm text-muted-foreground"><strong>Disciplina:</strong> {assessment.subject}</p>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedStudentId}
                onClick={() => setStep("taking")}
              >
                Iniciar Avaliação
              </Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Step 3: Finished
  if (step === "finished") {
    const correctAnswers = questions.filter(q => answers[q.id] === q.correct_answer).length;
    const scorePercentage = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
    const selectedStudent = students.find(s => s.id === selectedStudentId);

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-8 text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Avaliação Finalizada!</h1>
            <p className="text-muted-foreground">Os resultados foram salvos com sucesso.</p>

            <div className="bg-muted/50 rounded-xl p-6 space-y-3 text-left">
              <p className="text-sm"><strong>Aluno:</strong> {selectedStudent?.name}</p>
              <p className="text-sm"><strong>Avaliação:</strong> {assessment.title}</p>
              <p className="text-sm"><strong>Acertos:</strong> {correctAnswers} de {questions.length}</p>
              <div className="flex items-center gap-3">
                <strong className="text-sm">Nota:</strong>
                <Badge className={`text-lg px-3 py-1 ${scorePercentage >= 70 ? "bg-primary/10 text-primary" : scorePercentage >= 50 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>
                  {scorePercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={scorePercentage} className="h-3" />
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/aluno")}>Voltar ao Módulo</Button>
              <Button onClick={() => navigate("/relatorios")}>Ver Relatórios</Button>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Step 2: Taking assessment
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{assessment.title}</h1>
            <p className="text-xs text-muted-foreground">{assessment.year} · {assessment.subject}</p>
          </div>
          <div className="flex items-center gap-3">
            {autoSaveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <CheckCircle className="h-3 w-3" /> Salvo
              </span>
            )}
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {answeredCount}/{questions.length}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-2" />

        {/* Question navigator */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(i)}
              className={`h-8 w-8 rounded-md text-xs font-medium border transition-colors ${
                i === currentIdx
                  ? "bg-primary text-primary-foreground border-primary"
                  : answers[q.id]
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Current question */}
        {currentQuestion && (
          <Card className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-base font-semibold text-foreground">
                Questão {currentIdx + 1} de {questions.length}
              </h2>
              {currentQuestion.skill && (
                <Badge variant="secondary" className="text-xs shrink-0">{currentQuestion.skill}</Badge>
              )}
            </div>

            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {currentQuestion.statement}
            </p>

            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(val) => handleAnswer(currentQuestion.id, val)}
              className="space-y-3"
            >
              {[
                { key: "A", value: currentQuestion.option_a },
                { key: "B", value: currentQuestion.option_b },
                { key: "C", value: currentQuestion.option_c },
                { key: "D", value: currentQuestion.option_d },
              ].map(opt => (
                <Label
                  key={opt.key}
                  htmlFor={`opt-${opt.key}`}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    answers[currentQuestion.id] === opt.key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <RadioGroupItem value={opt.key} id={`opt-${opt.key}`} className="mt-0.5" />
                  <span className="text-sm">
                    <strong className="mr-1">{opt.key})</strong>
                    {opt.value}
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(i => i - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>

          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx(i => i + 1)}>
              Próxima <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < questions.length}
              className="gap-1"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Finalizar Avaliação
            </Button>
          )}
        </div>

        {answeredCount < questions.length && currentIdx === questions.length - 1 && (
          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Responda todas as questões para finalizar ({questions.length - answeredCount} pendente(s))
          </p>
        )}
      </div>
    </AppLayout>
  );
}
