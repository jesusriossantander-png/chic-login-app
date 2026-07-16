import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gavel, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const LOCAL_FINES_KEY = "safetydesk:fines";

const infracciones = [
  "Exceso de velocidad",
  "Estacionamiento prohibido",
  "Luz roja",
  "Documentación vencida",
  "Falta de cinturón",
  "Uso de celular",
  "Maniobra peligrosa",
  "Otra",
] as const;

const estados = ["Pendiente", "Pagada", "Apelada"] as const;

type Fine = {
  id: string;
  user_id: string;
  infraccion: string;
  monto: number;
  fecha: string;
  vehiculo: string;
  conductor: string;
  estado: (typeof estados)[number];
  observaciones: string;
  created_at: string;
};

function readLocal<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

function writeLocal<T>(key: string, values: T[]) {
  localStorage.setItem(key, JSON.stringify(values));
}

export function MultasPage({ user, searchQuery }: { user: User; searchQuery?: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState(searchQuery ?? "");
  useEffect(() => setSearch(searchQuery ?? ""), [searchQuery]);
  const [openNew, setOpenNew] = useState(false);
  const [localMode, setLocalMode] = useState(true);

  const fines = useQuery({
    queryKey: ["fines", user.id],
    queryFn: async () => {
      if (localMode) return readLocal<Fine>(LOCAL_FINES_KEY);
      const { data, error } = await supabase.from("fines").select("*").order("fecha", { ascending: false });
      if (error) {
        if ((error as { code?: string }).code === "PGRST205") { setLocalMode(true); return readLocal<Fine>(LOCAL_FINES_KEY); }
        throw error;
      }
      return data;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (fines.data ?? []).filter((fine) =>
      !term || [fine.infraccion, fine.vehiculo, fine.conductor].filter(Boolean).some((v) => v!.toLowerCase().includes(term))
    );
  }, [fines.data, search]);

  const remove = useMutation({
    mutationFn: async (fine: Fine) => {
      if (localMode) { writeLocal(LOCAL_FINES_KEY, readLocal<Fine>(LOCAL_FINES_KEY).filter((f) => f.id !== fine.id)); return; }
      const { error } = await supabase.from("fines").delete().eq("id", fine.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Multa eliminada"); qc.invalidateQueries({ queryKey: ["fines"] }); },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Gavel className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Infracciones</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Multas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de infracciones, multas y su estado de pago.
          </p>
        </div>
        <button onClick={() => setOpenNew(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
          <Plus className="h-4 w-4" /> Agregar multa
        </button>
      </div>

      <div className="relative mt-8 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por infracción, vehículo o conductor..." />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {fines.isLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : filtered.length ? (
          <div className="divide-y divide-border">
            {filtered.map((fine) => (
              <div key={fine.id} className="flex items-center gap-4 px-5 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-primary">
                  <Gavel className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{fine.infraccion}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      fine.estado === "Pagada" ? "bg-emerald-100 text-emerald-700" :
                      fine.estado === "Apelada" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>{fine.estado}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>${fine.monto.toLocaleString()}</span>
                    <span>·</span>
                    <span>{fine.fecha}</span>
                    {fine.vehiculo && <><span>·</span><span>{fine.vehiculo}</span></>}
                    {fine.conductor && <><span>·</span><span>{fine.conductor}</span></>}
                  </div>
                </div>
                <button onClick={() => confirm("¿Eliminar multa?") && remove.mutate(fine)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-surface text-muted-foreground"><Gavel className="h-5 w-5" /></div>
            <p className="mt-3 text-sm text-muted-foreground">{search ? "No se encontraron multas." : "Todavía no hay multas registradas."}</p>
            <button onClick={() => setOpenNew(true)} className="mt-3 text-sm font-medium text-primary hover:underline">Agregar la primera</button>
          </div>
        )}
      </div>

      {openNew && <FineModal userId={user.id} localMode={localMode} onClose={() => setOpenNew(false)} />}
      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-card); padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; } .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }`}</style>
    </div>
  );
}

function FineModal({ userId, localMode, onClose }: { userId: string; localMode: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [infraccion, setInfraccion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [vehiculo, setVehiculo] = useState("");
  const [conductor, setConductor] = useState("");
  const [estado, setEstado] = useState<(typeof estados)[number]>("Pendiente");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [customInfraccion, setCustomInfraccion] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const tipoFinal = infraccion === "Otra" ? customInfraccion.trim() : infraccion;
    if (!tipoFinal || !monto) return toast.error("Completá la infracción y el monto");
    setSaving(true);
    try {
      if (localMode) {
        const fine: Fine = {
          id: crypto.randomUUID(), user_id: userId, infraccion: tipoFinal,
          monto: Number(monto), fecha, vehiculo, conductor, estado, observaciones,
          created_at: new Date().toISOString(),
        };
        writeLocal(LOCAL_FINES_KEY, [...readLocal<Fine>(LOCAL_FINES_KEY), fine]);
        toast.success("Multa guardada en este navegador");
      } else {
        const { error } = await supabase.from("fines").insert({
          user_id: userId, infraccion: tipoFinal, monto: Number(monto),
          fecha, vehiculo, conductor, estado, observaciones,
        });
        if (error) throw error;
        toast.success("Multa registrada");
      }
      qc.invalidateQueries({ queryKey: ["fines"] });
      onClose();
    } catch (error) {
      if ((error as { code?: string }).code === "PGRST205") {
        writeLocal(LOCAL_FINES_KEY, [...readLocal<Fine>(LOCAL_FINES_KEY), {
          id: crypto.randomUUID(), user_id: userId, infraccion: tipoFinal,
          monto: Number(monto), fecha, vehiculo, conductor, estado, observaciones,
          created_at: new Date().toISOString(),
        }]);
        toast.success("Multa guardada en este navegador");
        qc.invalidateQueries({ queryKey: ["fines"] });
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
          <div><h2 className="text-base font-semibold">Agregar multa</h2><p className="mt-1 text-xs text-muted-foreground">Completá los datos de la infracción.</p></div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-medium">Tipo de infracción</span>
              <select className="input" value={infraccion} onChange={(e) => setInfraccion(e.target.value)} required>
                <option value="">Seleccionar...</option>
                {infracciones.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
            {infraccion === "Otra" && (
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium">Especificar infracción</span>
                <input className="input" value={customInfraccion} onChange={(e) => setCustomInfraccion(e.target.value)} placeholder="Detalle de la infracción" required />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Monto ($)</span>
              <input type="number" className="input" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0" min="0" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Fecha</span>
              <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Vehículo</span>
              <input className="input" value={vehiculo} onChange={(e) => setVehiculo(e.target.value)} placeholder="Patente / interno" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Conductor</span>
              <input className="input" value={conductor} onChange={(e) => setConductor(e.target.value)} placeholder="Nombre" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium">Estado</span>
              <select className="input" value={estado} onChange={(e) => setEstado(e.target.value as (typeof estados)[number])}>
                {estados.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Observaciones</span>
            <textarea className="input min-h-20 resize-y" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Detalles adicionales..." />
          </label>
          <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar multa
          </button>
        </form>
      </div>
      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-card); padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; } .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }`}</style>
    </div>
  );
}
