import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AssessmentResult {
  id: string;
  student_id: string;
  assessment_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  completed_at: string | null;
}

interface StudentResponse {
  id: string;
  student_id: string;
  assessment_id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
}

interface Assessment {
  id: string;
  title: string;
  subject: string;
  year: string;
  status: string;
}

interface Student {
  id: string;
  name: string;
  school: string;
  class: string;
  school_year: string;
}

interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  statement: string;
  skill: string;
  position: number;
}

export interface DashboardData {
  summary: {
    totalAlunos: number;
    totalEscolas: number;
    mediaGeral: number;
    totalAvaliacoes: number;
  };
  schoolChartData: { escola: string; media: number; count: number }[];
  nivelData: { name: string; value: number }[];
  evolutionData: Record<string, string | number>[];
  schoolRanking: { ESCOLA: string; total: number; media: number }[];
  questionChartData: { questao: string; acerto: number; skill: string }[];
  avaliacoes: string[];
  anos: string[];
  schools: string[];
  hasRealData: boolean;
  loading: boolean;
}

const NIVEL_ORDER = ["Muito Crítico", "Crítico", "Satisfatório"];

function getNivel(score: number): string {
  if (score >= 60) return "Satisfatório";
  if (score >= 40) return "Crítico";
  return "Muito Crítico";
}

export function useDashboardData(filters?: {
  avaliacao?: string;
  disciplina?: string;
  ano?: string;
  escola?: string;
}) {
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [resResults, resResponses, resAssessments, resStudents, resQuestions] =
        await Promise.all([
          supabase.from("assessment_results").select("*"),
          supabase.from("student_responses").select("*"),
          supabase.from("assessments").select("*"),
          supabase.from("students").select("*"),
          supabase.from("assessment_questions").select("id, assessment_id, statement, skill, position"),
        ]);

      const r = resResults.data || [];
      const resp = resResponses.data || [];
      const a = resAssessments.data || [];
      const s = resStudents.data || [];
      const q = resQuestions.data || [];

      setResults(r);
      setResponses(resp);
      setAssessments(a);
      setStudents(s);
      setQuestions(q);
      setHasRealData(true);
      setLoading(false);
    };

    fetchAll();
  }, []);

  const data = useMemo<DashboardData>(() => {
    const assessmentMap = new Map(assessments.map((a) => [a.id, a]));
    const studentMap = new Map(students.map((s) => [s.id, s]));
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Apply filters
    let filteredResults = [...results];
    if (filters?.avaliacao && filters.avaliacao !== "all") {
      const aIds = assessments.filter((a) => a.title === filters.avaliacao).map((a) => a.id);
      filteredResults = filteredResults.filter((r) => aIds.includes(r.assessment_id));
    }
    if (filters?.disciplina && filters.disciplina !== "all") {
      const aIds = assessments.filter((a) => a.subject === filters.disciplina).map((a) => a.id);
      filteredResults = filteredResults.filter((r) => aIds.includes(r.assessment_id));
    }
    if (filters?.ano && filters.ano !== "all") {
      const sIds = students.filter((s) => s.school_year === filters.ano).map((s) => s.id);
      filteredResults = filteredResults.filter((r) => sIds.includes(r.student_id));
    }
    if (filters?.escola && filters.escola !== "all") {
      const sIds = students.filter((s) => s.school === filters.escola).map((s) => s.id);
      filteredResults = filteredResults.filter((r) => sIds.includes(r.student_id));
    }

    // Unique students & schools
    const uniqueStudentIds = new Set(filteredResults.map((r) => r.student_id));
    const uniqueSchools = new Set<string>();
    uniqueStudentIds.forEach((sid) => {
      const s = studentMap.get(sid);
      if (s?.school) uniqueSchools.add(s.school);
    });

    let filteredAssessments = [...assessments];
    if (filters?.avaliacao && filters.avaliacao !== "all") {
      filteredAssessments = filteredAssessments.filter((a) => a.title === filters.avaliacao);
    }
    if (filters?.disciplina && filters.disciplina !== "all") {
      filteredAssessments = filteredAssessments.filter((a) => a.subject === filters.disciplina);
    }

    const totalAlunos = uniqueStudentIds.size;
    const totalEscolas = uniqueSchools.size;
    const mediaGeral = filteredResults.length > 0
      ? Math.round(filteredResults.reduce((sum, r) => sum + r.score_percentage, 0) / filteredResults.length * 10) / 10
      : 0;
    const uniqueAssessments = new Set(filteredAssessments.map((a) => a.id));
    const totalAvaliacoes = uniqueAssessments.size;

    // School chart data
    const schoolGroups: Record<string, { total: number; count: number }> = {};
    filteredResults.forEach((r) => {
      const s = studentMap.get(r.student_id);
      const escola = s?.school || "Sem escola";
      if (!schoolGroups[escola]) schoolGroups[escola] = { total: 0, count: 0 };
      schoolGroups[escola].total += r.score_percentage;
      schoolGroups[escola].count += 1;
    });
    const schoolChartData = Object.entries(schoolGroups)
      .map(([escola, g]) => ({ escola, media: Math.round(g.total / g.count * 10) / 10, count: g.count }))
      .sort((a, b) => b.media - a.media)
      .slice(0, 15);

    // Nivel distribution
    const nivelCounts: Record<string, number> = {};
    filteredResults.forEach((r) => {
      const nivel = getNivel(r.score_percentage);
      nivelCounts[nivel] = (nivelCounts[nivel] || 0) + 1;
    });
    const nivelData = NIVEL_ORDER
      .map((n) => ({ name: n, value: nivelCounts[n] || 0 }))
      .filter((d) => d.value > 0);

    // Evolution by assessment
    const avalTitles = [...new Set(assessments.map((a) => a.title))];
    const evolutionData = avalTitles.map((title) => {
      const aIds = assessments.filter((a) => a.title === title).map((a) => a.id);
      const relevant = results.filter((r) => aIds.includes(r.assessment_id));
      const bySubject: Record<string, { total: number; count: number }> = {};
      relevant.forEach((r) => {
        const a = assessmentMap.get(r.assessment_id);
        const subject = a?.subject || "Outros";
        if (!bySubject[subject]) bySubject[subject] = { total: 0, count: 0 };
        bySubject[subject].total += r.score_percentage;
        bySubject[subject].count += 1;
      });
      const entry: Record<string, string | number> = { name: title };
      Object.entries(bySubject).forEach(([subj, g]) => {
        entry[subj] = Math.round(g.total / g.count * 10) / 10;
      });
      return entry;
    });

    // School ranking
    const schoolRanking = Object.entries(schoolGroups)
      .map(([escola, g]) => ({
        ESCOLA: escola,
        total: g.count,
        media: Math.round(g.total / g.count * 10) / 10,
      }))
      .sort((a, b) => b.media - a.media);

    // Question performance from responses
    const questionGroups: Record<string, { correct: number; total: number; skill: string; position: number }> = {};
    let filteredResponses = [...responses];
    if (filters?.avaliacao && filters.avaliacao !== "all") {
      const aIds = assessments.filter((a) => a.title === filters.avaliacao).map((a) => a.id);
      filteredResponses = filteredResponses.filter((r) => aIds.includes(r.assessment_id));
    }
    if (filters?.disciplina && filters.disciplina !== "all") {
      const aIds = assessments.filter((a) => a.subject === filters.disciplina).map((a) => a.id);
      filteredResponses = filteredResponses.filter((r) => aIds.includes(r.assessment_id));
    }

    filteredResponses.forEach((r) => {
      const q = questionMap.get(r.question_id);
      const position = q?.position ?? 0;
      const key = `Q${position + 1}`;
      if (!questionGroups[key]) questionGroups[key] = { correct: 0, total: 0, skill: q?.skill || "", position };
      questionGroups[key].total += 1;
      if (r.is_correct) questionGroups[key].correct += 1;
    });
    const questionChartData = Object.entries(questionGroups)
      .map(([questao, g]) => ({
        questao,
        acerto: g.total > 0 ? Math.round(g.correct / g.total * 1000) / 10 : 0,
        skill: g.skill,
      }))
      .sort((a, b) => parseInt(a.questao.slice(1)) - parseInt(b.questao.slice(1)));

    const anos = [...new Set(students.map((s) => s.school_year).filter(Boolean))].sort();
    const schoolList = [...uniqueSchools].sort();

    return {
      summary: { totalAlunos, totalEscolas, mediaGeral, totalAvaliacoes },
      schoolChartData,
      nivelData,
      evolutionData,
      schoolRanking,
      questionChartData,
      avaliacoes: avalTitles,
      anos,
      schools: schoolList,
      hasRealData: true,
      loading,
    };
  }, [results, responses, assessments, students, questions, hasRealData, loading, filters]);

  return data;
}
