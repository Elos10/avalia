import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ClipboardList, Loader2, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ReleasedAssessment {
  id: string;
  title: string;
  year: string;
  subject: string;
  status: string;
  questionCount: number;
}

export default function AvailableAssessments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<ReleasedAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      // Get releases for this user
      const { data: releases } = await supabase
        .from("assessment_releases")
        .select("assessment_id")
        .eq("user_id", user.id);

      if (!releases || releases.length === 0) {
        setAssessments([]);
        setLoading(false);
        return;
      }

      const assessmentIds = releases.map(r => r.assessment_id);

      const { data: assessmentData } = await supabase
        .from("assessments")
        .select("id, title, year, subject, status")
        .in("id", assessmentIds);

      if (!assessmentData) {
        setAssessments([]);
        setLoading(false);
        return;
      }

      // Get question counts
      const { data: questions } = await supabase
        .from("assessment_questions")
        .select("assessment_id")
        .in("assessment_id", assessmentIds);

      const countMap: Record<string, number> = {};
      questions?.forEach(q => {
        countMap[q.assessment_id] = (countMap[q.assessment_id] || 0) + 1;
      });

      setAssessments(assessmentData.map(a => ({
        ...a,
        questionCount: countMap[a.id] || 0,
      })));
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">📋 Avaliações Disponíveis</h1>
            <p className="text-muted-foreground text-sm">Selecione uma avaliação para aplicar</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : assessments.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-medium text-foreground">Nenhuma avaliação liberada</p>
            <p className="text-sm text-muted-foreground">Aguarde a liberação pelo administrador ou coordenador.</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assessments.map(a => (
              <Card key={a.id} className="p-5 flex items-center justify-between hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{a.year}</Badge>
                      <Badge variant="outline" className="text-xs">{a.subject}</Badge>
                      <span className="text-xs text-muted-foreground">{a.questionCount} questões</span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => navigate(`/avaliar/${a.id}`)}>
                  Aplicar
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
