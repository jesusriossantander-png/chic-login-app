import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X, Gauge } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/conduccion")({
  component: ConduccionPage,
});

const schema = z.object({
  driver_name: z.string().trim().min(1, "Nombre requerido").max(120),
  vehicle: z.string().trim().max(80).optional(),
  control_date: z.string(),
  score: z.number().int().min(0).max(100),
  notes: z.string().trim().max(2000).optional(),
});

function ConduccionPage() {
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
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

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("driving_controls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Control eliminado");
      qc.invalidateQueries({ queryKey: ["driving_controls"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avg = data.length ? Math.round(data.reduce((a, b) => a + b.score, 0) / data.length) : 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Control de conducción</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra la evaluación de cada conductor con su puntaje.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo control
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatBox label="Controles" value={data.length} />
        <StatBox label="Puntaje promedio" value={avg} suffix="/100" />
        <StatBox label="Aprobados (≥80)" value={data.filter((d) => d.score >= 80).length} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Sin controles todavía.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-surface text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{c.driver_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.vehicle ?? "Sin vehículo"} · {c.control_date}
                  </div>
                </div>
                <ScoreBar score={c.score} />
                <button
                  onClick={() => confirm("¿Eliminar control?") && del.mutate(c.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && <NewControlModal onClose={() => setOpen(false)} userId={user.id} />}
    </div>
  );
}

function StatBox({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">
        {value}
        {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-destructive";
  return (
    <div className="hidden w-40 items-center gap-3 sm:flex">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
        <div className={`h-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-semibold tabular-nums">{score}</span>
    </div>
  );
}

function NewControlModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    driver_name: "",
    vehicle: "",
    control_date: new Date().toISOString().slice(0, 10),
    score: 90,
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      const { error } = await supabase.from("driving_controls").insert({ ...parsed, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Control registrado");
      qc.invalidateQueries({ queryKey: ["driving_controls"] });
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
          <h2 className="text-base font-semibold">Nuevo control</h2>
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
          <F label="Conductor">
            <input className="input" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} required />
          </F>
          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Vehículo">
              <input className="input" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} placeholder="Patente / modelo" />
            </F>
            <F label="Fecha">
              <input type="date" className="input" value={form.control_date} onChange={(e) => setForm({ ...form, control_date: e.target.value })} required />
            </F>
          </div>
          <F label={`Puntaje: ${form.score}/100`}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={form.score}
              onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
              className="w-full accent-[var(--color-primary)]"
            />
          </F>
          <F label="Notas">
            <textarea className="input min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
              Guardar control
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .input {
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
