import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/informes")({
  component: InformesPage,
});

const severities = ["baja", "media", "alta", "critica"] as const;
const statuses = ["abierto", "en_revision", "cerrado"] as const;

const schema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(140),
  location: z.string().trim().max(140).optional(),
  report_date: z.string(),
  severity: z.enum(severities),
  status: z.enum(statuses),
  description: z.string().trim().max(2000).optional(),
  corrective_actions: z.string().trim().max(2000).optional(),
});

function InformesPage() {
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
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

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("safety_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informe eliminado");
      qc.invalidateQueries({ queryKey: ["safety_reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Informes de seguridad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra incidentes, condiciones inseguras y acciones correctivas.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo informe
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Aún no hay informes. Crea el primero.
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="hidden grid-cols-12 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
              <div className="col-span-5">Título</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2">Severidad</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-1 text-right">Acción</div>
            </div>
            {data.map((r) => (
              <div key={r.id} className="grid grid-cols-1 gap-1 px-5 py-4 md:grid-cols-12 md:items-center md:gap-4">
                <div className="md:col-span-5">
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground">{r.location ?? "Sin ubicación"}</div>
                </div>
                <div className="text-sm text-muted-foreground md:col-span-2">{r.report_date}</div>
                <div className="md:col-span-2">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {r.severity}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {r.status === "en_revision" ? "en revisión" : r.status}
                  </span>
                </div>
                <div className="md:col-span-1 md:text-right">
                  <button
                    onClick={() => confirm("¿Eliminar informe?") && del.mutate(r.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && <NewReportModal onClose={() => setOpen(false)} userId={user.id} />}
    </div>
  );
}

function NewReportModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    location: "",
    report_date: new Date().toISOString().slice(0, 10),
    severity: "media" as (typeof severities)[number],
    status: "abierto" as (typeof statuses)[number],
    description: "",
    corrective_actions: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      const { error } = await supabase.from("safety_reports").insert({ ...parsed, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Informe creado");
      qc.invalidateQueries({ queryKey: ["safety_reports"] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : "Error";
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-card shadow-[var(--shadow-elevated)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Nuevo informe</h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
          className="space-y-4 p-5"
        >
          <F label="Título">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </F>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Ubicación">
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </F>
            <F label="Fecha">
              <input type="date" className="input" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} required />
            </F>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Severidad">
              <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as (typeof severities)[number] })}>
                {severities.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </F>
            <F label="Estado">
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as (typeof statuses)[number] })}>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s === "en_revision" ? "en revisión" : s}</option>
                ))}
              </select>
            </F>
          </div>
          <F label="Descripción">
            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </F>
          <F label="Acciones correctivas">
            <textarea className="input min-h-[60px]" value={form.corrective_actions} onChange={(e) => setForm({ ...form, corrective_actions: e.target.value })} />
          </F>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar informe
            </button>
          </div>
        </form>
      </div>
      <style>{`
        :where(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-card);
          padding: 0.55rem 0.7rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }
      `}</style>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
