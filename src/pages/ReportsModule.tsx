import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Filter, Download, TrendingDown, TrendingUp, AlertTriangle, Loader2, Database } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function ReportsModule() {
  const [selectedEscola, setSelectedEscola] = useState<string>("all");
  const [selectedAno, setSelectedAno] = useState<string>("all");
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("all");

  const data = useDashboardData({
    escola: selectedEscola,
    ano: selectedAno,
    disciplina: selectedDisciplina,
  });

  if (data.loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const { summary, questionChartData, schoolChartData, schools, anos } = data;

  const criticalQuestions = questionChartData.filter((q) => q.acerto < 40).sort((a, b) => a.acerto - b.acerto);
  const strongQuestions = questionChartData.filter((q) => q.acerto >= 60).sort((a, b) => b.acerto - a.acerto);

  // Year chart from schoolChartData (already filtered)
  const yearChartData = (() => {
    // We reuse the schoolChartData but need year-level grouping
    // Since useDashboardData already applies filters, we show schoolChartData by school
    return schoolChartData;
  })();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">📊 Relatórios Diagnósticos</h1>
            <p className="text-muted-foreground text-sm mt-1">Análise pedagógica detalhada dos resultados</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <Database className="h-3 w-3" />
              {data.hasRealData ? "Dados em tempo real" : "Dados históricos"}
            </Badge>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <Download className="h-4 w-4" />
              Exportar Relatório
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl p-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={selectedEscola} onChange={(e) => setSelectedEscola(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
            <option value="all">Todas Escolas</option>
            {schools.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={selectedAno} onChange={(e) => setSelectedAno(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
            <option value="all">Todos os Anos</option>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={selectedDisciplina} onChange={(e) => setSelectedDisciplina(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
            <option value="all">Todas Disciplinas</option>
            <option value="Língua Portuguesa">Língua Portuguesa</option>
            <option value="Matemática">Matemática</option>
          </select>
        </div>

        {/* Question performance chart */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Percentual de Acertos por Questão</h3>
          {questionChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado de respostas disponível para os filtros selecionados</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={questionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="questao" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  labelFormatter={(label) => {
                    const q = questionChartData.find((d) => d.questao === label);
                    return q?.skill ? `${label} — ${q.skill}` : label;
                  }}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Bar dataKey="acerto" radius={[4, 4, 0, 0]}>
                  {questionChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.acerto >= 60 ? "hsl(142, 71%, 45%)" : entry.acerto >= 40 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* School performance */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Desempenho por Escola</h3>
          {yearChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                <XAxis dataKey="escola" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8 }} />
                <Bar dataKey="media" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]}>
                  {yearChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.media >= 60 ? "hsl(142, 71%, 45%)" : entry.media >= 40 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Diagnostic analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-critical/5 border border-critical/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-critical" />
              <h3 className="font-semibold text-foreground">Pontos de Atenção</h3>
            </div>
            <div className="space-y-3">
              {criticalQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhuma questão com acerto abaixo de 40%</p>
              ) : (
                criticalQuestions.slice(0, 5).map((q) => (
                  <div key={q.questao} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-critical" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{q.questao}</span>
                        {q.skill && <p className="text-xs text-muted-foreground">{q.skill}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-critical">{q.acerto}%</span>
                  </div>
                ))
              )}
              <p className="text-xs text-muted-foreground mt-2">
                💡 Sugestão: Reforçar as habilidades associadas a estas questões com atividades diferenciadas e intervenção pedagógica direcionada.
              </p>
            </div>
          </div>

          <div className="bg-success/5 border border-success/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-foreground">Pontos Fortes</h3>
            </div>
            <div className="space-y-3">
              {strongQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhuma questão com acerto acima de 60%</p>
              ) : (
                strongQuestions.slice(0, 5).map((q) => (
                  <div key={q.questao} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
                    <div>
                      <span className="text-sm font-medium text-foreground">{q.questao}</span>
                      {q.skill && <p className="text-xs text-muted-foreground">{q.skill}</p>}
                    </div>
                    <span className="text-sm font-semibold text-success">{q.acerto}%</span>
                  </div>
                ))
              )}
              <p className="text-xs text-muted-foreground mt-2">
                ✅ Estas questões demonstram domínio satisfatório. Manter e aprofundar as habilidades consolidadas.
              </p>
            </div>
          </div>
        </div>

        {/* Pedagogical analysis */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-3">📝 Análise Diagnóstica Pedagógica</h3>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
            <p>
              Com base nos dados de <strong className="text-foreground">{summary.totalAlunos.toLocaleString()} alunos</strong> distribuídos em <strong className="text-foreground">{summary.totalEscolas} escolas</strong>,
              a rede apresenta uma média geral de <strong className="text-foreground">{summary.mediaGeral}%</strong> de acertos nas avaliações diagnósticas.
            </p>
            <p>
              <strong className="text-foreground">Classificação:</strong> A média geral indica nível{" "}
              <strong className={summary.mediaGeral >= 60 ? "text-success" : summary.mediaGeral >= 40 ? "text-warning" : "text-critical"}>
                {summary.mediaGeral >= 60 ? "Satisfatório" : summary.mediaGeral >= 40 ? "Crítico" : "Muito Crítico"}
              </strong>.
            </p>
            <p>
              <strong className="text-foreground">Recomendações:</strong> Sugere-se a implementação de grupos de estudo diferenciados,
              atividades de reforço focadas nos descritores com menor desempenho, e acompanhamento individualizado para alunos
              classificados nos níveis "Muito Crítico" e "Crítico".
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
