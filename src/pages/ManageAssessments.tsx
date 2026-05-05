import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Search, Trash2, Eye, Send, FileText, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Assessment {
  id: string;
  title: string;
  year: string;
  subject: string;
  status: string;
  created_at: string;
}

interface AssessmentQuestion {
  id: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  skill: string;
  position: number;
}

const YEARS = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"];
const SUBJECTS = ["Matemática", "Língua Portuguesa"];

export default function ManageAssessments() {
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [viewing, setViewing] = useState<Assessment | null>(null);
  const [viewQuestions, setViewQuestions] = useState<AssessmentQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const fetchAssessments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setAssessments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssessments(); }, []);

  const handleView = async (a: Assessment) => {
    setViewing(a);
    setLoadingQuestions(true);
    const { data } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("assessment_id", a.id)
      .order("position");
    setViewQuestions(data || []);
    setLoadingQuestions(false);
  };

  const handleDelete = async (id: string) => {
    // Delete questions first, then assessment
    await supabase.from("assessment_questions").delete().eq("assessment_id", id);
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Avaliação excluída" });
      fetchAssessments();
    }
  };

  const togglePublish = async (id: string) => {
    const item = assessments.find((a) => a.id === id);
    if (!item) return;
    const newStatus = item.status === "publicada" ? "rascunho" : "publicada";
    const { error } = await supabase.from("assessments").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "publicada" ? "Avaliação publicada!" : "Publicação removida" });
      fetchAssessments();
    }
  };

  const filtered = assessments.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchYear = filterYear === "all" || a.year === filterYear;
    const matchSubject = filterSubject === "all" || a.subject === filterSubject;
    return matchSearch && matchYear && matchSubject;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">📋 Gerenciar Avaliações</h1>
            <p className="text-sm text-muted-foreground">Edite, exclua e publique avaliações existentes</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Título da avaliação..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="w-full md:w-40 space-y-2">
                <Label>Ano</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48 space-y-2">
                <Label>Disciplina</Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> {loading ? "Carregando..." : `${filtered.length} avaliação(ões)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhuma avaliação encontrada</p>
                <p className="text-sm mt-1">Crie uma avaliação no módulo administrativo.</p>
                <Link to="/admin/criar"><Button variant="outline" className="mt-4">Criar Avaliação</Button></Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell><Badge variant="secondary">{a.year}</Badge></TableCell>
                      <TableCell>{a.subject}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "publicada" ? "default" : "outline"}>
                          {a.status === "publicada" ? "Publicada" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(a.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" title="Visualizar" onClick={() => handleView(a)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title={a.status === "publicada" ? "Despublicar" : "Publicar"} onClick={() => togglePublish(a.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita. A avaliação "{a.title}" será removida permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(a.id)}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{viewing?.title}</DialogTitle></DialogHeader>
            {viewing && (
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">{viewing.year}</Badge>
                  <Badge variant="outline">{viewing.subject}</Badge>
                  <Badge variant={viewing.status === "publicada" ? "default" : "outline"}>{viewing.status === "publicada" ? "Publicada" : "Rascunho"}</Badge>
                </div>
                {loadingQuestions ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : viewQuestions.map((q, i) => (
                  <Card key={q.id} className="border-border">
                    <CardContent className="pt-4 space-y-2">
                      <p className="font-medium text-sm">Questão {i + 1}{q.skill && <Badge variant="outline" className="ml-2 font-mono text-xs">{q.skill}</Badge>}</p>
                      <p className="text-sm">{q.statement}</p>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        {["A", "B", "C", "D"].map((l) => (
                          <p key={l} className={`px-2 py-1 rounded ${q.correct_answer === l ? "bg-success/10 text-success font-medium" : "text-muted-foreground"}`}>
                            {l}) {q[`option_${l.toLowerCase()}` as keyof AssessmentQuestion] as string}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
