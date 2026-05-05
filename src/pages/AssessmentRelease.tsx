import { AppLayout } from "@/components/AppLayout";
import { ArrowLeft, Send, Search, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { userManagementService, type ManagedUser } from "@/services/userManagementService";

interface Assessment {
  id: string;
  title: string;
  year: string;
  subject: string;
  status: string;
}

interface UserProfile extends ManagedUser {}

export default function AssessmentRelease() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [releasedUserIds, setReleasedUserIds] = useState<Set<string>>(new Set());
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedAssessment) fetchReleases();
  }, [selectedAssessment]);

  const fetchAssessments = async () => {
    const { data } = await supabase.from("assessments").select("id, title, year, subject, status");
    if (data) setAssessments(data);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const managedUsers = await userManagementService.list();
      setUsers(managedUsers);
    } catch (error: any) {
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReleases = async () => {
    const { data } = await supabase
      .from("assessment_releases")
      .select("user_id")
      .eq("assessment_id", selectedAssessment);
    if (data) {
      const ids = new Set(data.map(r => r.user_id));
      setReleasedUserIds(ids);
      setSelectedUsers(ids);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedUsers.size === filtered.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filtered.map(u => u.user_id)));
    }
  };

  const handleSave = async () => {
    if (!selectedAssessment) {
      toast({ title: "Selecione uma avaliação", variant: "destructive" });
      return;
    }
    setSaving(true);

    // Remove old releases
    await supabase.from("assessment_releases").delete().eq("assessment_id", selectedAssessment);

    // Insert new releases
    if (selectedUsers.size > 0) {
      const rows = Array.from(selectedUsers).map(uid => ({
        assessment_id: selectedAssessment,
        user_id: uid,
        released_by: user?.id,
      }));
      const { error } = await supabase.from("assessment_releases").insert(rows);
      if (error) {
        toast({ title: "Erro ao salvar liberações", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    setReleasedUserIds(new Set(selectedUsers));
    toast({ title: `Avaliação liberada para ${selectedUsers.size} usuário(s)` });
    setSaving(false);
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    coordenador: "Coordenador",
    professor: "Professor",
  };

  const roleColors: Record<string, string> = {
    admin: "bg-primary/10 text-primary",
    coordenador: "bg-accent/10 text-accent",
    professor: "bg-success/10 text-success",
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedAssessmentData = assessments.find(a => a.id === selectedAssessment);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">📋 Liberação de Avaliações</h1>
            <p className="text-muted-foreground text-sm mt-1">Libere avaliações para professores, coordenadores e administradores</p>
          </div>
        </div>

        {/* Assessment selector */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Selecionar Avaliação</h2>
          {assessments.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma avaliação disponível. Crie uma avaliação primeiro.</p>
          ) : (
            <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
              <SelectTrigger className="w-full sm:w-96">
                <SelectValue placeholder="Escolha uma avaliação publicada..." />
              </SelectTrigger>
              <SelectContent>
                {assessments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.title} — {a.year} · {a.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedAssessmentData && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedAssessmentData.year}</Badge>
              <Badge variant="outline">{selectedAssessmentData.subject}</Badge>
              <Badge className={`border-0 ${selectedAssessmentData.status === 'publicada' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{selectedAssessmentData.status === 'publicada' ? 'Publicada' : selectedAssessmentData.status === 'rascunho' ? 'Rascunho' : selectedAssessmentData.status}</Badge>
            </div>
          )}
        </div>

        {/* Users list */}
        {selectedAssessment && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                Salvar Liberações
              </Button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filtered.length > 0 && selectedUsers.size === filtered.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
                  ) : (
                    filtered.map(u => (
                      <TableRow key={u.user_id} className="cursor-pointer" onClick={() => toggleUser(u.user_id)}>
                        <TableCell>
                          <Checkbox checked={selectedUsers.has(u.user_id)} onCheckedChange={() => toggleUser(u.user_id)} />
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{u.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email || "—"}</TableCell>
                        <TableCell>
                          <Badge className={`${roleColors[u.role] || ""} border-0`}>{roleLabels[u.role] || u.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {releasedUserIds.has(u.user_id) ? (
                            <span className="flex items-center gap-1 text-xs text-success"><CheckCircle className="h-3.5 w-3.5" /> Liberado</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3.5 w-3.5" /> Não liberado</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <p className="text-xs text-muted-foreground">{selectedUsers.size} usuário(s) selecionado(s)</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
