import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, CarFront, Gauge, Gavel, User, X } from "lucide-react";

const LOCAL_VEHICLES_KEY = "safetydesk:vehicles";
const LOCAL_FINES_KEY = "safetydesk:fines";

type Vehicle = {
  id: string;
  license_plate: string;
  driver_name: string | null;
  driver_document: string | null;
  internal_number: string | null;
  brand: string | null;
  model: string | null;
};

type Fine = {
  id: string;
  infraccion: string;
  monto: number;
  conductor: string;
  vehiculo: string;
  estado: string;
};

type Control = {
  id: string;
  driver_name: string;
  control_date: string;
  score: number;
};

type PersonResult = {
  name: string;
  module: "conduccion" | "vehiculos" | "multas";
  label: string;
  to: string;
  detail: string;
};

function readLocal<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

export function PersonSearch() {
  const [query, setQuery] = useState("");
  const [controls, setControls] = useState<Control[]>([]);
  const [controlsLoaded, setControlsLoaded] = useState(false);

  const vehicles = useMemo(() => readLocal<Vehicle>(LOCAL_VEHICLES_KEY), []);
  const fines = useMemo(() => readLocal<Fine>(LOCAL_FINES_KEY), []);

  const term = query.trim().toLowerCase();

  const results = useMemo<PersonResult[]>(() => {
    if (!term || term.length < 2) return [];

    const hits: PersonResult[] = [];

    for (const v of vehicles) {
      const name = v.driver_name;
      if (name && name.toLowerCase().includes(term)) {
        hits.push({
          name,
          module: "vehiculos",
          label: "Vehículo",
          to: "/vehiculos",
          detail: `${v.license_plate || v.internal_number || "—"} · ${v.brand || ""} ${v.model || ""}`.trim().replace(/  +/g, " "),
        });
      }
    }

    for (const f of fines) {
      if (f.conductor && f.conductor.toLowerCase().includes(term)) {
        hits.push({
          name: f.conductor,
          module: "multas",
          label: "Multa",
          to: "/jesus/multas",
          detail: `${f.infraccion} · $${f.monto.toLocaleString()} · ${f.estado}`,
        });
      }
    }

    for (const c of controls) {
      if (c.driver_name && c.driver_name.toLowerCase().includes(term)) {
        hits.push({
          name: c.driver_name,
          module: "conduccion",
          label: "Control de conducción",
          to: "/conduccion",
          detail: `${c.control_date} · Puntaje: ${c.score}/100`,
        });
      }
    }

    return hits;
  }, [term, vehicles, fines, controls]);

  function handleFocus() {
    if (controlsLoaded) return;
    setControlsLoaded(true);
    import("@supabase/supabase-js").then(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("driving_controls").select("id, driver_name, control_date, score").order("control_date", { ascending: false });
      if (data) setControls(data as Control[]);
    }).catch(() => {});
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Buscar persona por nombre o apellido..."
          className="input input--search w-full pr-9"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query && term.length >= 2 && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-border/50 bg-card p-2 shadow-xl shadow-black/5">
          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <User className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">No se encontraron personas con ese nombre.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((r, i) => (
                <Link
                  key={`${r.module}-${i}`}
                  to={r.to}
                  search={{ q: r.name }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface"
                >
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    r.module === "vehiculos" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" :
                    r.module === "multas" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" :
                    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                  }`}>
                    {r.module === "vehiculos" ? <CarFront className="h-4 w-4" /> :
                     r.module === "multas" ? <Gavel className="h-4 w-4" /> :
                     <Gauge className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">{r.label}</span>
                      <span>·</span>
                      <span className="truncate">{r.detail}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`:where(.input) { width: 100%; border-radius: 0.75rem; border: 1px solid var(--color-border); background: var(--color-card); font-size: 0.875rem; outline: none; } .input:not(.input--search) { padding: 0.625rem 0.75rem; } .input--search { padding: 0.625rem 2.5rem 0.625rem 2.5rem; } .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }`}</style>
    </div>
  );
}
