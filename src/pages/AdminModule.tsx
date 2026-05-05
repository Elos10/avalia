import { AppLayout } from "@/components/AppLayout";
import { BookOpen, Plus, FileText, Database, Lock, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminModule() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">🔐 Núcleo Administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">Criação e gerenciamento de avaliações diagnósticas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Plus, title: "Criar Avaliação", desc: "Nova avaliação diagnóstica com seleção de ano, disciplina e questões", color: "primary" },
            { icon: FileText, title: "Gerenciar Avaliações", desc: "Editar, excluir e publicar avaliações existentes", color: "accent" },
            { icon: Database, title: "Banco de Questões", desc: "Acesse e reutilize questões do banco de dados", color: "success" },
            { icon: Lock, title: "Controle de Acesso", desc: "Gerencie usuários e permissões do sistema", color: "warning" },
            { icon: BookOpen, title: "Habilidades BNCC", desc: "Cadastre e vincule descritores e habilidades", color: "primary" },
            { icon: FileText, title: "Liberar Avaliação", desc: "Libere avaliações para professores e coordenadores", color: "accent" },
          ].map((item) => {
            const linkTargets: Record<string, string> = { "Criar Avaliação": "/admin/criar", "Gerenciar Avaliações": "/admin/gerenciar", "Banco de Questões": "/admin/banco-questoes", "Controle de Acesso": "/admin/acesso", "Habilidades BNCC": "/admin/habilidades", "Liberar Avaliação": "/admin/liberar" };
            const Wrapper = linkTargets[item.title] ? Link : "div";
            const wrapperProps = linkTargets[item.title] ? { to: linkTargets[item.title] } : {};
            return (
            <Wrapper
              key={item.title}
              {...(wrapperProps as any)}
              className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer animate-fade-in"
            >
              <div className={`p-3 rounded-lg w-fit mb-4 ${
                item.color === "primary" ? "gradient-primary" :
                item.color === "accent" ? "bg-accent/10" :
                item.color === "success" ? "bg-success/10" : "bg-warning/10"
              }`}>
                <item.icon className={`h-6 w-6 ${
                  item.color === "primary" ? "text-primary-foreground" :
                  item.color === "accent" ? "text-accent" :
                  item.color === "success" ? "text-success" : "text-warning"
                }`} />
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
            </Wrapper>
          );})}

        </div>

        <div className="bg-success/5 border border-success/20 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-success mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">Sistema conectado ao banco de dados</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Todas as funcionalidades estão ativas com autenticação segura e persistência de dados em tempo real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
