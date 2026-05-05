import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, BookOpen, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Settings, label: "Núcleo Administrativo", path: "/admin" },
  { icon: GraduationCap, label: "Módulo do Aluno", path: "/aluno" },
  { icon: ClipboardList, label: "Aplicar Avaliação", path: "/avaliacoes" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
];

export function AppSidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card shadow-md border border-border"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">AVD Diagnóstica</h1>
              <p className="text-xs text-sidebar-muted">Rede Municipal 2025</p>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-sidebar-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          {user && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-sidebar-muted truncate max-w-[160px]">{user.email}</p>
              <button onClick={signOut} className="text-sidebar-muted hover:text-destructive transition-colors" title="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-sidebar-muted text-center">© 2025 Avaliação Diagnóstica</p>
        </div>
      </aside>
    </>
  );
}
