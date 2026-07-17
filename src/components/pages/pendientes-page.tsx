import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, ListTodo, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const LOCAL_PENDINGS_KEY = "safetydesk:pendings";

const prioridades = ["Baja", "Media", "Alta", "Crítica"] as const;
const categorias = ["Documentación", "Seguridad", "Mantenimiento", "Capacitación", "General"] as const;

type Pending = {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string;
  prioridad: (typeof prioridades)[number];
  categoria: (typeof categorias)[number];
  fecha_limite: string;
  completada: boolean;
  created_at: string;
};

function readLocal<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

function writeLocal<T>(key: string, values: T[]) {
  localStorage.setItem(key, JSON.stringify(values));
}

export function PendientesPage({ user }: { user: User }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "pendientes" | "completadas">("pendientes");
  const [openNew, setOpenNew] = useState(false);
  const [localMode, setLocalMode] = useState(true);

  const pendings = useQuery({
    queryKey: ["pendings", user.id],
    queryFn: async () => {
      if (localMode) return readLocal<Pending>(LOCAL_PENDINGS_KEY);
      const { data, error } = await supabase.from("pendings").select("*").order("created_at", { ascending: false });
      if (error) {
        if ((error as { code?: string }).code === "PGRST205") { setLocalMode(true); return readLocal<Pending>(LOCAL_PENDINGS_KEY); }
        throw error;
      }
      return data;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (pendings.data ?? []).filter((p) => {
      if (filtroEstado === "pendientes" && p.completada) return false;
      if (filtroEstado === "completadas" && !p.completada) return false;
      if (!term) return true;
      return [p.titulo, p.descripcion, p.categoria, p.prioridad].filter(Boolean).some((v) => v!.toLowerCase().includes(term));
    });
  }, [pendings.data, search, filtroEstado]);

  const toggleComplete = useMutation({
    mutationFn: async (item: Pending) => {
      if (localMode) {
        const items = readLocal<Pending>(LOCAL_PENDINGS_KEY);
        writeLocal(LOCAL_PENDINGS_KEY, items.map((p) => p.id === item.id ? { ...p, completada: !p.completada } : p));
        return;
      }
      const { error } = await supabase.from("pendings").update({ completada: !item.completada }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["pendings"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (item: Pending) => {
      if (localMode) { writeLocal(LOCAL_PENDINGS_KEY, readLocal<Pending>(LOCAL_PENDINGS_KEY).filter((p) => p.id !== item.id)); return; }
      const { error } = await supabase.from("pendings").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Pendiente eliminado"); qc.invalidateQueries({ queryKey: ["pendings"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <ListTodo className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tareas</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pendientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná las tareas y obligaciones pendientes del módulo JESUS.
          </p>
        </div>
        <button onClick={() => setOpenNew(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          <Plus className="h-4 w-4" /> Agregar pendiente
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className="input input--search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pendientes..." />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
          {(["todas", "pendientes", "completadas"] as const).map((f) => (
            <button key={f} onClick={() => setFiltroEstado(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filtroEstado === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >{f === "todas" ? "Todas" : f === "pendientes" ? "Pendientes" : "Completadas"}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {pendings.isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length ? (
          filtered.map((item) => (
            <div key={item.id} className={`flex items-center gap-3 rounded-2xl border border-border p-4 transition ${
              item.completada ? "bg-surface/50" : "bg-card"
            }`}>
              <button onClick={() => toggleComplete.mutate(item)} className="shrink-0 text-muted-foreground hover:text-primary transition">
                {item.completada ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`text-sm font-medium ${item.completada ? "line-through text-muted-foreground" : ""}`}>{item.titulo}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    item.prioridad === "Crítica" ? "bg-red-100 text-red-700" :
                    item.prioridad === "Alta" ? "bg-amber-100 text-amber-700" :
                    item.prioridad === "Media" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>{item.prioridad}</span>
                  <span>{item.categoria}</span>
                  {item.fecha_limite && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.fecha_limite}</span>}
                  {item.descripcion && <span>· {item.descripcion}</span>}
                </div>
              </div>
              <button onClick={() => confirm("¿Eliminar pendiente?") && remove.mutate(item)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-surface text-muted-foreground"><ListTodo className="h-5 w-5" /></div>
            <p className="mt-3 text-sm text-muted-foreground">
              {search ? "No se encontraron pendientes." : filtroEstado === "completadas" ? "No hay tareas completadas." : "Todavía no hay tareas pendientes."}
            </p>
            <button onClick={() => setOpenNew(true)} className="mt-3 text-sm font-medium text-primary hover:underline">Agregar la primera</button>
          </div>
        )}
      </div>

      {openNew && <PendingModal userId={user.id} localMode={localMode} onClose={() => setOpenNew(false)} />}
      <style>{`:where(.input) { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-card); font-size: 0.875rem; outline: none; } .input:not(.input--search) { padding: 0.625rem 0.75rem; } .input--search { padding: 0.625rem 2.5rem; } .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }`}</style>
    </div>
  );
}

function PendingModal({ userId, localMode, onClose }: { userId: string; localMode: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<(typeof prioridades)[number]>("Media");
  const [categoria, setCategoria] = useState<(typeof categorias)[number]>("General");
  const [fechaLimite, setFechaLimite] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return toast.error("El título es obligatorio");
    setSaving(true);
    try {
      if (localMode) {
        const item: Pending = {
          id: crypto.randomUUID(), user_id: userId, titulo: titulo.trim(),
          descripcion: descripcion.trim(), prioridad, categoria,
          fecha_limite: fechaLimite, completada: false, created_at: new Date().toISOString(),
        };
        writeLocal(LOCAL_PENDINGS_KEY, [...readLocal<Pending>(LOCAL_PENDINGS_KEY), item]);
        toast.success("Pendiente guardado en este navegador");
      } else {
        const { error } = await supabase.from("pendings").insert({
          user_id: userId, titulo: titulo.trim(), descripcion: descripcion.trim() || null,
          prioridad, categoria, fecha_limite: fechaLimite || null,
        });
        if (error) throw error;
        toast.success("Pendiente creado");
      }
      qc.invalidateQueries({ queryKey: ["pendings"] });
      onClose();
    } catch (error) {
      if ((error as { code?: string }).code === "PGRST205") {
        writeLocal(LOCAL_PENDINGS_KEY, [...readLocal<Pending>(LOCAL_PENDINGS_KEY), {
          id: crypto.randomUUID(), user_id: userId, titulo: titulo.trim(),
          descripcion: descripcion.trim(), prioridad, categoria,
          fecha_limite: fechaLimite, completada: false, created_at: new Date().toISOString(),
        }]);
        toast.success("Pendiente guardado en este navegador");
        qc.invalidateQueries({ queryKey: ["pendings"] });
        onClose();
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-card shadow-[var(--shadow-elevated)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><h2 className="text-base font-semibold">Agregar pendiente</h2><p className="mt-1 text-xs text-muted-foreground">Creá una nueva tarea u obligación.</p></div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Título</span>
            <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Renovar seguro vehículo 12" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Descripción (opcional)</span>
            <textarea className="input min-h-20 resize-y" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Detalles de la tarea..." />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Prioridad</span>
              <select className="input" value={prioridad} onChange={(e) => setPrioridad(e.target.value as (typeof prioridades)[number])}>
                {prioridades.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Categoría</span>
              <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value as (typeof categorias)[number])}>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Fecha límite</span>
              <input type="date" className="input" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar pendiente
          </button>
        </form>
      </div>
      <style>{`:where(.input) { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-card); font-size: 0.875rem; outline: none; } .input:not(.input--search) { padding: 0.625rem 0.75rem; } .input--search { padding: 0.625rem 2.5rem; } .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }`}</style>
    </div>
  );
}
