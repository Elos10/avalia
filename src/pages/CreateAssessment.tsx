import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Save, Database, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Question {
  id: number;
  statement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  skill: string;
  questionId?: string; // reference to bank question
}

interface BankQuestion {
  id: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  skill: string;
  year: string;
  subject: string;
}

const emptyQuestion = (id: number): Question => ({
  id, statement: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "", skill: "",
});

const YEARS = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"];
const SUBJECTS = ["Matemática", "Língua Portuguesa"];

export default function CreateAssessment() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion(1)]);
  const [saving, setSaving] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);

  useEffect(() => {
    if (importOpen && (year || subject)) {
      fetchBankQuestions();
    }
  }, [importOpen, year, subject]);

  const fetchBankQuestions = async () => {
    setLoadingBank(true);
    let query = supabase.from("questions").select("*");
    if (year) query = query.eq("year", year);
    if (subject) query = query.eq("subject", subject);
    const { data } = await query.order("created_at", { ascending: false });
    setBankQuestions(data || []);
    setLoadingBank(false);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion(prev.length + 1)]);
  };

  const importFromBank = () => {
    const selected = bankQuestions.filter((bq) => selectedBankIds.includes(bq.id));
    const newQuestions = selected.map((bq, i) => ({
      id: questions.length + i + 1,
      statement: bq.statement,
      optionA: bq.option_a,
      optionB: bq.option_b,
      optionC: bq.option_c,
      optionD: bq.option_d,
      correctAnswer: bq.correct_answer,
      skill: bq.skill,
      questionId: bq.id,
    }));
    setQuestions((prev) => [...prev, ...newQuestions]);
    setSelectedBankIds([]);
    setImportOpen(false);
    toast({ title: "Questões importadas!", description: `${selected.length} questão(ões) adicionada(s).` });
  };

  const removeQuestion = (id: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id).map((q, i) => ({ ...q, id: i + 1 })));
  };

  const updateQuestion = (id: number, field: keyof Question, value: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const handleSave = async () => {
    if (!title || !year || !subject) {
      toast({ title: "Campos obrigatórios", description: "Preencha título, ano escolar e disciplina.", variant: "destructive" });
      return;
    }
    const incomplete = questions.some((q) => !q.statement || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer);
    if (incomplete) {
      toast({ title: "Questões incompletas", description: "Preencha todos os campos de cada questão.", variant: "destructive" });
      return;
    }

    setSaving(true);
    // Create assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({ title, year, subject, status: "rascunho", created_by: user?.id })
      .select("id")
      .single();

    if (assessmentError || !assessment) {
      toast({ title: "Erro ao salvar avaliação", description: assessmentError?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Insert assessment questions
    const questionRows = questions.map((q, i) => ({
      assessment_id: assessment.id,
      statement: q.statement,
      option_a: q.optionA,
      option_b: q.optionB,
      option_c: q.optionC,
      option_d: q.optionD,
      correct_answer: q.correctAnswer,
      skill: q.skill || "",
      position: i + 1,
      question_id: q.questionId || null,
    }));

    const { error: questionsError } = await supabase.from("assessment_questions").insert(questionRows);
    if (questionsError) {
      toast({ title: "Erro ao salvar questões", description: questionsError.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "Avaliação salva!", description: `"${title}" foi criada com ${questions.length} questão(ões).` });
    setTitle(""); setYear(""); setSubject("");
    setQuestions([emptyQuestion(1)]);
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Criar Avaliação</h1>
            <p className="text-sm text-muted-foreground">Preencha os dados e adicione as questões</p>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Informações da Avaliação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input placeholder="Ex: 1ª AVD 2025" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ano Escolar</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Questões ({questions.length})</h2>
            <div className="flex gap-2">
              <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline"><Database className="h-4 w-4 mr-1" /> Importar do Banco</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Importar Questões do Banco</DialogTitle></DialogHeader>
                  {!year && !subject ? (
                    <p className="text-sm text-muted-foreground py-4">Selecione o ano escolar e a disciplina da avaliação para filtrar as questões disponíveis.</p>
                  ) : loadingBank ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : bankQuestions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">Nenhuma questão encontrada no banco para os filtros selecionados.</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{bankQuestions.length} questão(ões) disponível(is) • {selectedBankIds.length} selecionada(s)</p>
                      {bankQuestions.map((bq) => (
                        <div key={bq.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                          <Checkbox
                            checked={selectedBankIds.includes(bq.id)}
                            onCheckedChange={(checked) => {
                              setSelectedBankIds((prev) => checked ? [...prev, bq.id] : prev.filter((id) => id !== bq.id));
                            }}
                          />
                          <div className="flex-1 text-sm">
                            <p className="font-medium">{bq.statement}</p>
                            <div className="flex gap-2 mt-1">
                              {bq.skill && <Badge variant="secondary" className="text-xs">{bq.skill}</Badge>}
                              <Badge variant="outline" className="text-xs">{bq.year}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button onClick={importFromBank} disabled={selectedBankIds.length === 0} className="w-full">
                        Importar {selectedBankIds.length} questão(ões)
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              <Button onClick={addQuestion} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" /> Adicionar Questão
              </Button>
            </div>
          </div>

          {questions.map((q) => (
            <Card key={q.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Questão {q.id}</CardTitle>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Enunciado</Label>
                  <Textarea placeholder="Digite o enunciado da questão..." value={q.statement} onChange={(e) => updateQuestion(q.id, "statement", e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(["A", "B", "C", "D"] as const).map((letter) => (
                    <div key={letter} className="space-y-1">
                      <Label className="text-xs">Alternativa {letter}</Label>
                      <Input
                        placeholder={`Opção ${letter}`}
                        value={q[`option${letter}` as keyof Question] as string}
                        onChange={(e) => updateQuestion(q.id, `option${letter}` as keyof Question, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Resposta Correta</Label>
                    <Select value={q.correctAnswer} onValueChange={(v) => updateQuestion(q.id, "correctAnswer", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{["A", "B", "C", "D"].map((l) => <SelectItem key={l} value={l}>Alternativa {l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Habilidade / Descritor (BNCC)</Label>
                    <Input placeholder="Ex: EF05MA01 ou D01" value={q.skill} onChange={(e) => updateQuestion(q.id, "skill", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3 justify-end pb-8">
          <Link to="/admin"><Button variant="outline">Cancelar</Button></Link>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar Avaliação
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
