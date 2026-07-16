import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CarFront, LayoutDashboard, ClipboardList, Gauge, LogOut, Shield, FolderTree, ChevronDown, BookOpen, Gavel, ListTodo, Sun, Moon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const nav = [
  { to: "/dashboard", label: "Panel.", icon: LayoutDashboard },
  { to: "/informes", label: "Informes", icon: ClipboardList },
  { to: "/conduccion", label: "Conducción", icon: Gauge },
  { to: "/vehiculos", label: "Vehículos", icon: CarFront },
] as const;

const jesusSubItems = [
  { to: "/jesus/documentacion", label: "Documentación", icon: BookOpen },
  { to: "/jesus/multas", label: "Multas", icon: Gavel },
  { to: "/jesus/pendientes", label: "Pendientes", icon: ListTodo },
] as const;

function AuthedLayout() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [jesusOpen, setJesusOpen] = useState(pathname.startsWith("/jesus"));
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("safetydesk:theme", next ? "dark" : "light");
  }

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const jesusActive = pathname.startsWith("/jesus");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-card backdrop-blur-xl lg:flex dark:bg-white/[0.04]">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">SafetyDesk</span>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-1">
            <button
              onClick={() => setJesusOpen(!jesusOpen)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                jesusActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              <FolderTree className="h-4 w-4" />
              JESUS
              <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${jesusOpen ? "" : "-rotate-90"}`} />
            </button>
            {jesusOpen && (
              <div className="ml-4 mt-1 space-y-1">
                {jesusSubItems.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const SubIcon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <SubIcon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center justify-between px-2 text-xs text-muted-foreground">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-foreground">{user.email}</div>
              <div>Sesión activa</div>
            </div>
            <button
              onClick={toggleTheme}
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-surface hover:text-foreground"
              aria-label={dark ? "Modo claro" : "Modo oscuro"}
              title={dark ? "Modo claro" : "Modo oscuro"}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-5 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background">
            <Shield className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-semibold">SafetyDesk</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground"
            aria-label={dark ? "Modo claro" : "Modo oscuro"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={handleSignOut}
            className="rounded-md p-2 text-muted-foreground hover:text-foreground"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <nav className="sticky top-[52px] z-10 flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2 lg:hidden">
        {[...nav, { to: "/jesus/documentacion", label: "JESUS", icon: FolderTree }].map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                active ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
