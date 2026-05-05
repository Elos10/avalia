import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Search, Eye, Database, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BankQuestion {
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
  created_at: string;
}

const YEARS = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"];
const SUBJECTS = ["Matemática", "Língua Portuguesa"];

export default function QuestionBank() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<BankQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  const [statement, setStatement] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correct, setCorrect] = useState("");
  const [skill, setSkill] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar questões", description: error.message, variant: "destructive" });
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  const filtered = questions.filter((q) => {
    const matchSearch = q.statement.toLowerCase().includes(search.toLowerCase()) || q.skill.toLowerCase().includes(search.toLowerCase());
    const matchYear = filterYear === "all" || q.year === filterYear;
    const matchSubject = filterSubject === "all" || q.subject === filterSubject;
    return matchSearch && matchYear && matchSubject;
  });

  const resetForm = () => {
    setStatement(""); setOptA(""); setOptB(""); setOptC(""); setOptD("");
    setCorrect(""); setSkill(""); setYear(""); setSubject("");
  };

  const handleAdd = async () => {
    if (!statement || !optA || !optB || !optC || !optD || !correct || !year || !subject) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("questions").insert({
      statement,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correct,
      skill,
      year,
      subject,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Questão adicionada!", description: "A questão foi salva no banco." });
      resetForm();
      setDialogOpen(false);
      fetchQuestions();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Questão removida" });
      fetchQuestions();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de Questões</h1>
            <p className="text-sm text-muted-foreground">Cadastre e reutilize questões nas avaliações</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por enunciado ou habilidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas disciplinas</SelectItem>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Nova Questão</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Cadastrar Questão</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
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
                    </div>
                    <div className="space-y-2">
                      <Label>Enunciado</Label>
                      <Textarea placeholder="Digite o enunciado..." value={statement} onChange={(e) => setStatement(e.target.value)} rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Alternativa A</Label><Input value={optA} onChange={(e) => setOptA(e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Alternativa B</Label><Input value={optB} onChange={(e) => setOptB(e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Alternativa C</Label><Input value={optC} onChange={(e) => setOptC(e.target.value)} /></div>
                      <div className="space-y-1"><Label className="text-xs">Alternativa D</Label><Input value={optD} onChange={(e) => setOptD(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Resposta Correta</Label>
                        <Select value={correct} onValueChange={setCorrect}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{["A","B","C","D"].map((l) => <SelectItem key={l} value={l}>Alternativa {l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Habilidade / Descritor</Label>
                        <Input placeholder="Ex: EF05MA01" value={skill} onChange={(e) => setSkill(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAdd} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>{loading ? "Carregando..." : `${questions.length} questão(ões) no banco • ${filtered.length} exibida(s)`}</span>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enunciado</TableHead>
                    <TableHead className="hidden md:table-cell">Ano</TableHead>
                    <TableHead className="hidden md:table-cell">Disciplina</TableHead>
                    <TableHead className="hidden md:table-cell">Habilidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma questão encontrada</TableCell></TableRow>
                  ) : filtered.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-xs truncate">{q.statement}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline">{q.year}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell">{q.subject}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="secondary">{q.skill || "—"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setViewQuestion(q)}><Eye className="h-4 w-4" /></Button></DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Detalhes da Questão</DialogTitle></DialogHeader>
                              {viewQuestion && (
                                <div className="space-y-3 text-sm">
                                  <p><strong>Enunciado:</strong> {viewQuestion.statement}</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(["A","B","C","D"] as const).map((l) => (
                                      <p key={l} className={viewQuestion.correct_answer === l ? "font-bold text-primary" : ""}>
                                        {l}) {viewQuestion[`option_${l.toLowerCase()}` as keyof BankQuestion] as string}
                                        {viewQuestion.correct_answer === l && " ✓"}
                                      </p>
                                    ))}
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{viewQuestion.year}</Badge>
                                    <Badge variant="secondary">{viewQuestion.subject}</Badge>
                                    {viewQuestion.skill && <Badge>{viewQuestion.skill}</Badge>}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(q.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
