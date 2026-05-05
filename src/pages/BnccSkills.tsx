import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Search, BookOpen, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const YEARS = ["1º Ano", "2º Ano", "3º Ano", "4º Ano", "5º Ano", "6º Ano", "7º Ano", "8º Ano", "9º Ano"];
const SUBJECTS = ["Matemática", "Língua Portuguesa"];

interface Skill {
  id: string;
  code: string;
  description: string;
  year: string;
  subject: string;
  area: string;
}

export default function BnccSkills() {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({ code: "", description: "", year: "", subject: "", area: "" });

  const fetchSkills = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bncc_skills")
      .select("*")
      .order("year")
      .order("code");
    if (error) {
      toast({ title: "Erro ao carregar habilidades", description: error.message, variant: "destructive" });
    } else {
      setSkills(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, []);

  const handleAdd = async () => {
    if (!newSkill.code || !newSkill.description || !newSkill.year || !newSkill.subject) {
      toast({ title: "Campos obrigatórios", description: "Preencha código, descrição, ano e disciplina.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("bncc_skills").insert({
      code: newSkill.code,
      description: newSkill.description,
      year: newSkill.year,
      subject: newSkill.subject,
      area: newSkill.area || "",
    });
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      return;
    }
    setNewSkill({ code: "", description: "", year: "", subject: "", area: "" });
    setDialogOpen(false);
    toast({ title: "Habilidade cadastrada!", description: `${newSkill.code} adicionada com sucesso.` });
    fetchSkills();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bncc_skills").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Habilidade removida" });
    fetchSkills();
  };

  const filtered = skills.filter((s) => {
    const matchSearch = !search || s.code.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    const matchYear = filterYear === "all" || s.year === filterYear;
    const matchSubject = filterSubject === "all" || s.subject === filterSubject;
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
            <h1 className="text-2xl font-bold text-foreground">📘 Habilidades BNCC</h1>
            <p className="text-sm text-muted-foreground">Cadastre e gerencie descritores e habilidades</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Código ou descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Nova Habilidade</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Cadastrar Habilidade</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Código</Label>
                        <Input placeholder="Ex: EF05MA01" value={newSkill.code} onChange={(e) => setNewSkill({ ...newSkill, code: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Área / Eixo</Label>
                        <Input placeholder="Ex: Números" value={newSkill.area} onChange={(e) => setNewSkill({ ...newSkill, area: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input placeholder="Descrição da habilidade" value={newSkill.description} onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Ano Escolar</Label>
                        <Select value={newSkill.year} onValueChange={(v) => setNewSkill({ ...newSkill, year: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Disciplina</Label>
                        <Select value={newSkill.subject} onValueChange={(v) => setNewSkill({ ...newSkill, subject: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleAdd} className="w-full">Cadastrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> {loading ? "Carregando..." : `${filtered.length} habilidade(s) encontrada(s)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell><Badge variant="outline" className="font-mono">{s.code}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate">{s.description}</TableCell>
                      <TableCell><Badge variant="secondary">{s.year}</Badge></TableCell>
                      <TableCell>{s.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{s.area || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma habilidade encontrada</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
