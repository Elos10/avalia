import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { GraduationCap, ClipboardList, CheckCircle, Clock, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function StudentModule() {
  const [name, setName] = useState("");
  const [enrollment, setEnrollment] = useState("");
  const [school, setSchool] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !enrollment.trim() || !schoolYear) {
      toast.error("Preencha os campos obrigatórios: Nome, Matrícula e Ano Escolar");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("students").insert({
        name: name.trim(),
        enrollment_number: enrollment.trim(),
        school: school.trim(),
        class: classGroup.trim(),
        school_year: schoolYear,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Número de matrícula já cadastrado");
        } else {
          toast.error("Erro ao cadastrar aluno: " + error.message);
        }
      } else {
        toast.success("Aluno cadastrado com sucesso!");
        setName(""); setEnrollment(""); setSchool(""); setClassGroup(""); setSchoolYear("");
      }
    } catch {
      toast.error("Erro inesperado ao cadastrar aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Selecione um arquivo CSV válido");
      return;
    }

    setImporting(true);
    try {
      let text = await file.text();
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("Arquivo CSV vazio ou sem dados");
        setImporting(false);
        return;
      }

      const separator = lines[0].includes(";") ? ";" : ",";
      const header = lines[0].toLowerCase().split(separator).map(h => h.trim().replace(/^["']|["']$/g, ""));
      const nameIdx = header.findIndex(h => h.includes("nome") || h === "name");
      const enrollIdx = header.findIndex(h => h.includes("matr") || h.includes("matricula") || h.includes("matrícula") || h === "enrollment");
      const schoolIdx = header.findIndex(h => h.includes("escola") || h === "school");
      const classIdx = header.findIndex(h => h.includes("turma") || h.includes("class"));
      const yearIdx = header.findIndex(h => h.includes("ano") || h.includes("year"));

      if (nameIdx === -1 || enrollIdx === -1) {
        toast.error("CSV deve conter colunas 'Nome' e 'Matrícula'");
        setImporting(false);
        return;
      }

      const students = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(separator).map(c => c.trim().replace(/^["']|["']$/g, ""));
        const sName = cols[nameIdx] || "";
        const sEnroll = cols[enrollIdx] || "";
        if (!sName || !sEnroll) continue;
        students.push({
          name: sName,
          enrollment_number: sEnroll,
          school: schoolIdx >= 0 ? (cols[schoolIdx] || "") : "",
          class: classIdx >= 0 ? (cols[classIdx] || "") : "",
          school_year: yearIdx >= 0 ? (cols[yearIdx] || "") : "",
        });
      }

      if (students.length === 0) {
        toast.error("Nenhum aluno válido encontrado no CSV");
        setImporting(false);
        return;
      }

      let inserted = 0;
      let hasError = false;
      for (let i = 0; i < students.length; i += 50) {
        const batch = students.slice(i, i + 50);
        const { error } = await supabase.from("students").insert(batch);
        if (error) {
          if (error.code === "23505") {
            toast.error("Alguns números de matrícula já existem no banco");
          } else {
            toast.error("Erro ao importar: " + error.message);
          }
          hasError = true;
          break;
        }
        inserted += batch.length;
      }
      if (!hasError) {
        toast.success(`${inserted} aluno(s) importado(s) com sucesso!`);
      }
    } catch {
      toast.error("Erro ao processar arquivo CSV");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🧑‍🎓 Módulo do Aluno</h1>
          <p className="text-muted-foreground text-sm mt-1">Cadastro e identificação dos alunos para avaliações diagnósticas</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="gradient-primary h-12 w-12 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Cadastro do Aluno</h2>
                  <p className="text-muted-foreground text-xs">Preencha os dados ou importe via CSV</p>
                </div>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVImport}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={importing}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Importar CSV
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nome Completo *</label>
                <input
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                  placeholder="Digite o nome do aluno"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Número da Matrícula *</label>
                <input
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                  placeholder="Digite o número da matrícula"
                  value={enrollment}
                  onChange={e => setEnrollment(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Escola</label>
                  <input
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                    placeholder="Nome da escola"
                    value={school}
                    onChange={e => setSchool(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Turma</label>
                  <input
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                    placeholder="Ex: 5º Ano A"
                    value={classGroup}
                    onChange={e => setClassGroup(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ano Escolar *</label>
                <select
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                  value={schoolYear}
                  onChange={e => setSchoolYear(e.target.value)}
                >
                  <option value="">Selecione o ano</option>
                  {["1º Ano","2º Ano","3º Ano","4º Ano","5º Ano","6º Ano","7º Ano","8º Ano","9º Ano"].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full gradient-primary text-primary-foreground font-semibold py-3"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Cadastrar Aluno
              </Button>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-4">
            <p className="text-xs text-muted-foreground">
              <strong>Formato CSV:</strong> Use ponto e vírgula (;) como separador. Colunas obrigatórias: <code>Nome</code>, <code>Matrícula</code>. Opcionais: <code>Escola</code>, <code>Turma</code>, <code>Ano</code>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              { icon: ClipboardList, label: "Questões objetivas", desc: "A, B, C, D" },
              { icon: Clock, label: "Tempo registrado", desc: "Duração da prova" },
              { icon: CheckCircle, label: "Envio seguro", desc: "Dados no banco" },
            ].map((f) => (
              <div key={f.label} className="bg-card border border-border rounded-xl p-4 text-center animate-fade-in">
                <f.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
