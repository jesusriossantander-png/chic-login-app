import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardList,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();

  const reports = useQuery({
    queryKey: ["safety_reports", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("safety_reports")
        .select("*")
        .order("report_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const controls = useQuery({
    queryKey: ["driving_controls", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driving_controls")
        .select("*")
        .order("control_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const reportsData = reports.data ?? [];
  const controlsData = controls.data ?? [];

  const open = reportsData.filter((r) => r.status !== "cerrado").length;
  const critical = reportsData.filter((r) => r.severity === "critica").length;
  const closed = reportsData.filter((r) => r.status === "cerrado").length;
  const avgScore =
    controlsData.length > 0
      ? Math.round(controlsData.reduce((a, b) => a + b.score, 0) / controlsData.length)
      : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Panel.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen de tus informes y controles activos.
          </p>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Informes totales"
          value={reportsData.length}
          hint="Todos los registros"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Abiertos"
          value={open}
          tone="warning"
          hint="Requieren atención"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Críticos"
          value={critical}
          tone="destructive"
          hint="Severidad crítica"
        />
        <StatCard
          icon={<Gauge className="h-4 w-4" />}
          label="Puntaje conducción"
          value={avgScore}
          suffix="/100"
          tone={avgScore >= 80 ? "success" : avgScore >= 60 ? "warning" : "destructive"}
          hint={`${controlsData.length} controles`}
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Informes recientes</h2>
            <Link to="/informes" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {reportsData.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.location ?? "Sin ubicación"} · {r.report_date}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={r.severity} />
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
            {reportsData.length === 0 && (
              <EmptyRow
                icon={<ClipboardList className="h-5 w-5" />}
                title="Sin informes todavía"
                cta={<Link to="/informes" className="text-sm font-medium text-primary hover:underline">Crear el primero</Link>}
              />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Últimos controles</h2>
            <Link to="/conduccion" className="text-xs font-medium text-muted-foreground hover:text-foreground">
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {controlsData.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{c.driver_name}</div>
                  <div className="text-xs text-muted-foreground">{c.control_date}</div>
                </div>
                <ScoreChip score={c.score} />
              </div>
            ))}
            {controlsData.length === 0 && (
              <EmptyRow
                icon={<Gauge className="h-5 w-5" />}
                title="Sin controles"
                cta={<Link to="/conduccion" className="text-sm font-medium text-primary hover:underline">Registrar control</Link>}
              />
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <MiniIndicator icon={<CheckCircle2 className="h-4 w-4" />} label="Cerrados" value={closed} />
        <MiniIndicator
          icon={<TrendingUp className="h-4 w-4" />}
          label="Tasa de resolución"
          value={
            reportsData.length ? Math.round((closed / reportsData.length) * 100) : 0
          }
          suffix="%"
        />
        <MiniIndicator
          icon={<Gauge className="h-4 w-4" />}
          label="Controles este mes"
          value={
            controlsData.filter((c) => {
              const d = new Date(c.control_date);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length
          }
        />
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  suffix,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
  suffix?: string;
  tone?: "success" | "warning" | "destructive";
}) {
  const dot =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : tone === "destructive"
          ? "bg-destructive"
          : "bg-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {icon}
          {label}
        </div>
        <span className={`h-2 w-2 rounded-full ${dot}`} />
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">
        {value}
        {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function MiniIndicator({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold">
        {value}
        {suffix}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    baja: "bg-muted text-muted-foreground",
    media: "bg-accent text-accent-foreground",
    alta: "bg-warning/20 text-warning-foreground",
    critica: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[severity] ?? ""}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "en_revision" ? "en revisión" : status;
  const map: Record<string, string> = {
    abierto: "border-warning/40 text-warning-foreground",
    en_revision: "border-primary/40 text-primary",
    cerrado: "border-success/40 text-success",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${map[status] ?? "border-border"}`}>
      {label}
    </span>
  );
}

function ScoreChip({ score }: { score: number }) {
  const tone = score >= 80 ? "bg-success/15 text-success" : score >= 60 ? "bg-warning/20 text-warning-foreground" : "bg-destructive/15 text-destructive";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{score}</span>;
}

function EmptyRow({ icon, title, cta }: { icon: React.ReactNode; title: string; cta: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-surface text-muted-foreground">{icon}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
      {cta}
    </div>
  );
}
