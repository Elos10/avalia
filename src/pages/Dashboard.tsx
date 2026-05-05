import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { Users, School, BarChart3, TrendingUp, Filter, Loader2, Database } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#ef4444", "#f59e0b", "#22c55e"];
const NIVEL_ORDER = ["Muito Crítico", "Crítico", "Satisfatório"];

export default function Dashboard() {
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<string>("all");
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>("all");
  const [selectedAno, setSelectedAno] = useState<string>("all");

  const data = useDashboardData({
    avaliacao: selectedAvaliacao,
    disciplina: selectedDisciplina,
    ano: selectedAno,
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

  const { summary, schoolChartData, nivelData, evolutionData, schoolRanking, avaliacoes, anos } = data;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Diagnóstico</h1>
            <p className="text-muted-foreground text-sm mt-1">Visão geral das avaliações diagnósticas da rede municipal</p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Database className="h-3 w-3" />
            {data.hasRealData ? "Dados em tempo real" : "Dados históricos"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} title="Total de Alunos" value={summary.totalAlunos.toLocaleString()} variant="primary" />
          <StatCard icon={School} title="Escolas" value={summary.totalEscolas} variant="default" />
          <StatCard icon={BarChart3} title="Média Geral" value={`${summary.mediaGeral}%`} variant={summary.mediaGeral >= 60 ? "success" : "warning"} />
          <StatCard icon={TrendingUp} title="Avaliações" value={summary.totalAvaliacoes} variant="default" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl p-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={selectedAvaliacao} onChange={(e) => setSelectedAvaliacao(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
            <option value="all">Todas Avaliações</option>
            {avaliacoes.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={selectedDisciplina} onChange={(e) => setSelectedDisciplina(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
            <option value="all">Todas Disciplinas</option>
            <option value="Língua Portuguesa">Língua Portuguesa</option>
            <option value="Matemática">Matemática</option>
          </select>
          <select value={selectedAno} onChange={(e) => setSelectedAno(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
            <option value="all">Todos os Anos</option>
            {anos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Desempenho por Escola (Top 15)</h3>
            {schoolChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível para os filtros selecionados</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={schoolChartData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="escola" type="category" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, border: '1px solid hsl(214,32%,91%)' }} />
                  <Bar dataKey="media" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Distribuição por Nível de Proficiência</h3>
            {nivelData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={nivelData} cx="50%" cy="50%" innerRadius={80} outerRadius={140} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
                    {nivelData.map((entry, i) => {
                      const colorIdx = NIVEL_ORDER.indexOf(entry.name);
                      return <Cell key={i} fill={COLORS[colorIdx >= 0 ? colorIdx : i % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} alunos`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Evolução por Avaliação</h3>
            {evolutionData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum dado disponível</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, border: '1px solid hsl(214,32%,91%)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="Língua Portuguesa" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Matemática" stroke="hsl(172, 66%, 50%)" strokeWidth={2} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* School Ranking */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Ranking de Escolas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Escola</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Alunos</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Média</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nível</th>
                </tr>
              </thead>
              <tbody>
                {schoolRanking.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted-foreground py-8">Nenhum dado disponível</td></tr>
                ) : (
                  schoolRanking.map((school, i) => (
                    <tr key={school.ESCOLA} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{school.ESCOLA}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{school.total}</td>
                      <td className="py-3 px-4 text-right font-semibold text-foreground">{school.media}%</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          school.media >= 60 ? "bg-success/10 text-success" :
                          school.media >= 40 ? "bg-warning/10 text-warning" :
                          "bg-critical/10 text-critical"
                        }`}>
                          {school.media >= 60 ? "Satisfatório" : school.media >= 40 ? "Crítico" : "Muito Crítico"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
