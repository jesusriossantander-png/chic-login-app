import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Gauge, ClipboardCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">SafetyDesk</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition hover:opacity-90"
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <section className="grid gap-14 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Gestión operativa · Seguridad e Higiene
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Informes claros.
              <br />
              <span className="text-muted-foreground">Decisiones seguras.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Carga informes de seguridad e higiene y controles de conducción en segundos.
              Visualiza indicadores clave desde un panel simple y actual.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Comenzar ahora <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elevated)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Panel de indicadores</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-success">
                  En vivo
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat icon={<ClipboardCheck className="h-4 w-4" />} label="Informes" value="128" />
                <MiniStat icon={<Gauge className="h-4 w-4" />} label="Puntaje avg." value="87" />
                <MiniStat label="Abiertos" value="12" tone="warning" />
                <MiniStat label="Críticos" value="2" tone="destructive" />
              </div>
              <div className="mt-5 h-24 rounded-lg bg-surface p-3">
                <div className="flex h-full items-end gap-1.5">
                  {[40, 60, 45, 72, 55, 80, 66, 90, 74, 82, 68, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-primary/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: "warning" | "destructive";
}) {
  const toneClass =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning-foreground"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
    </div>
  );
}
