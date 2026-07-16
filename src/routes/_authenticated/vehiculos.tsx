import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { CarFront, Download, FileText, Loader2, Plus, Search, Upload, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vehiculos")({ component: VehiculosPage });

type Vehicle = Tables<"vehicles">;
type VehicleDocument = Tables<"vehicle_documents">;

function VehiculosPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const vehicles = useQuery({
    queryKey: ["vehicles", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("license_plate");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (vehicles.data ?? []).filter((vehicle) =>
      !term || [vehicle.license_plate, vehicle.internal_number, vehicle.brand, vehicle.model, vehicle.driver_name]
        .filter(Boolean).some((value) => value!.toLowerCase().includes(term)),
    );
  }, [vehicles.data, search]);

  const remove = useMutation({
    mutationFn: async (vehicle: Vehicle) => {
      if (vehicle.photo_path) await supabase.storage.from("vehicle-files").remove([vehicle.photo_path]);
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicle.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Vehículo eliminado"); qc.invalidateQueries({ queryKey: ["vehicles"] }); setSelected(null); },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary"><CarFront className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-wider">Flota</span></div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Vehículos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consulta la flota, sus choferes y documentación.</p>
        </div>
        <button onClick={() => setOpenNew(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"><Plus className="h-4 w-4" /> Agregar vehículo</button>
      </div>

      <div className="relative mt-8 max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por patente, interno, marca o chofer..." /></div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        {vehicles.isLoading ? <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div> : filtered.length ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onDoubleClick={() => setSelected(vehicle)} />)}
          </div>
        ) : <div className="py-16 text-center text-sm text-muted-foreground">{search ? "No se encontraron vehículos." : "Todavía no hay vehículos cargados."}</div>}
      </div>

      {(selected || openNew) && <VehicleModal vehicle={selected} userId={user.id} onClose={() => { setSelected(null); setOpenNew(false); }} />}
      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-card); padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; } .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }`}</style>
    </div>
  );
}

function VehicleCard({ vehicle, onDoubleClick }: { vehicle: Vehicle; onDoubleClick: () => void }) {
  return <button onDoubleClick={onDoubleClick} onClick={() => toast.info("Hacé doble clic para abrir la ficha")} className="group overflow-hidden rounded-2xl border border-border bg-background text-left transition hover:border-primary/40 hover:shadow-md">
    <div className="grid h-36 place-items-center bg-surface text-muted-foreground"><CarFront className="h-12 w-12 transition group-hover:scale-110" /></div>
    <div className="p-4"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{vehicle.license_plate}</h2><span className="rounded-full bg-surface px-2 py-1 text-[10px] font-medium uppercase">{vehicle.vehicle_type}</span></div><p className="mt-1 text-sm text-muted-foreground">{[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Sin marca/modelo"}</p><p className="mt-3 text-xs text-muted-foreground">Chofer: {vehicle.driver_name || "Sin asignar"}</p></div>
  </button>;
}

function VehicleModal({ vehicle, userId, onClose }: { vehicle: Vehicle | null; userId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => ({
    internal_number: vehicle?.internal_number ?? "", license_plate: vehicle?.license_plate ?? "", vehicle_type: vehicle?.vehicle_type ?? "Camión", brand: vehicle?.brand ?? "", model: vehicle?.model ?? "", vehicle_year: vehicle?.vehicle_year?.toString() ?? "", color: vehicle?.color ?? "", mileage: vehicle?.mileage?.toString() ?? "", driver_name: vehicle?.driver_name ?? "", driver_document: vehicle?.driver_document ?? "", driver_license: vehicle?.driver_license ?? "", driver_license_expiry: vehicle?.driver_license_expiry ?? "", notes: vehicle?.notes ?? "",
  }));
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedVehicle, setSavedVehicle] = useState<Vehicle | null>(vehicle);
  const [docType, setDocType] = useState("Seguro");
  const [docExpiry, setDocExpiry] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  const docs = useQuery({
    queryKey: ["vehicle_documents", savedVehicle?.id],
    enabled: Boolean(savedVehicle),
    queryFn: async () => { const { data, error } = await supabase.from("vehicle_documents").select("*").eq("vehicle_id", savedVehicle!.id).order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  const photoUrl = useQuery({
    queryKey: ["vehicle_photo", savedVehicle?.photo_path],
    enabled: Boolean(savedVehicle?.photo_path),
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("vehicle-files").createSignedUrl(savedVehicle!.photo_path!, 300);
      if (error) throw error;
      return data.signedUrl;
    },
  });

  async function saveVehicle(event: React.FormEvent) {
    event.preventDefault();
    if (!form.license_plate.trim()) return toast.error("La patente es obligatoria");
    setSaving(true);
    let photoPath = savedVehicle?.photo_path ?? null;
    try {
      if (photo) { photoPath = `${userId}/vehicles/${crypto.randomUUID()}-${photo.name}`; const { error } = await supabase.storage.from("vehicle-files").upload(photoPath, photo); if (error) throw error; }
      const values = { ...form, vehicle_year: form.vehicle_year ? Number(form.vehicle_year) : null, mileage: form.mileage ? Number(form.mileage) : null, photo_path: photoPath, user_id: userId };
      const result = savedVehicle ? await supabase.from("vehicles").update(values).eq("id", savedVehicle.id).select().single() : await supabase.from("vehicles").insert(values).select().single();
      if (result.error) throw result.error;
      setSavedVehicle(result.data); qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success(savedVehicle ? "Vehículo actualizado" : "Vehículo guardado");
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar el vehículo"); } finally { setSaving(false); }
  }

  async function uploadDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!savedVehicle || !docFile) return toast.error("Guardá el vehículo y seleccioná un archivo");
    const path = `${userId}/vehicles/${savedVehicle.id}/${crypto.randomUUID()}-${docFile.name}`;
    try { const upload = await supabase.storage.from("vehicle-files").upload(path, docFile); if (upload.error) throw upload.error; const { error } = await supabase.from("vehicle_documents").insert({ vehicle_id: savedVehicle.id, user_id: userId, document_type: docType, file_name: docFile.name, file_path: path, expiry_date: docExpiry || null }); if (error) throw error; toast.success("Documentación cargada"); setDocFile(null); setDocExpiry(""); qc.invalidateQueries({ queryKey: ["vehicle_documents", savedVehicle.id] }); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo cargar la documentación"); }
  }

  async function downloadDocument(document: VehicleDocument) { const { data, error } = await supabase.storage.from("vehicle-files").createSignedUrl(document.file_path, 300); if (error) toast.error(error.message); else window.open(data.signedUrl, "_blank", "noopener,noreferrer"); }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/30 p-0 backdrop-blur-sm sm:p-6"><div className="mx-auto min-h-full w-full max-w-5xl overflow-hidden border border-border bg-card shadow-[var(--shadow-elevated)] sm:min-h-0 sm:rounded-2xl">
    <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-base font-semibold">{vehicle ? "Ficha del vehículo" : "Agregar vehículo"}</h2><p className="mt-1 text-xs text-muted-foreground">{vehicle ? "Doble clic para editar la información de la flota." : "Completá los datos principales."}</p></div><button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface"><X className="h-4 w-4" /></button></div>
    <div className="grid lg:grid-cols-[40%_60%]"><div className="flex min-h-72 flex-col items-center justify-center bg-surface p-6 text-center"><div className="grid h-56 w-full max-w-sm place-items-center overflow-hidden rounded-2xl border border-border bg-card text-muted-foreground">{(photoPreview || photoUrl.data) ? <img src={photoPreview || photoUrl.data} alt="Vehículo" className="h-full w-full object-cover" /> : <CarFront className="h-20 w-20" />}</div><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-background"><Upload className="h-4 w-4" /> {photo ? photo.name : "Cargar foto del vehículo"}<input type="file" accept="image/*" className="sr-only" onChange={(e) => { const selected = e.target.files?.[0] ?? null; setPhoto(selected); if (selected) setPhotoPreview(URL.createObjectURL(selected)); }} /></label></div>
      <div className="p-5"><form onSubmit={saveVehicle} className="space-y-5"><section><h3 className="text-sm font-semibold">Datos del vehículo</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Patente *"><input className="input" value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value.toUpperCase() })} required /></Field><Field label="Número interno"><input className="input" value={form.internal_number} onChange={(e) => setForm({ ...form, internal_number: e.target.value })} /></Field><Field label="Tipo"><input className="input" value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })} /></Field><Field label="Marca"><input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></Field><Field label="Modelo"><input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field><Field label="Año"><input type="number" className="input" value={form.vehicle_year} onChange={(e) => setForm({ ...form, vehicle_year: e.target.value })} /></Field><Field label="Color"><input className="input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></Field><Field label="Kilometraje"><input type="number" className="input" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} /></Field></div></section><section><h3 className="text-sm font-semibold">Datos del chofer</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Nombre completo"><input className="input" value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} /></Field><Field label="DNI"><input className="input" value={form.driver_document} onChange={(e) => setForm({ ...form, driver_document: e.target.value })} /></Field><Field label="Licencia"><input className="input" value={form.driver_license} onChange={(e) => setForm({ ...form, driver_license: e.target.value })} /></Field><Field label="Vencimiento licencia"><input type="date" className="input" value={form.driver_license_expiry} onChange={(e) => setForm({ ...form, driver_license_expiry: e.target.value })} /></Field></div></section><Field label="Observaciones"><textarea className="input min-h-20 resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {savedVehicle ? "Guardar cambios" : "Guardar vehículo"}</button></form>
      {savedVehicle && <section className="mt-8 border-t border-border pt-5"><h3 className="text-sm font-semibold">Documentación del vehículo</h3><form onSubmit={uploadDocument} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><Field label="Tipo"><input className="input" value={docType} onChange={(e) => setDocType(e.target.value)} /></Field><Field label="Vencimiento"><input type="date" className="input" value={docExpiry} onChange={(e) => setDocExpiry(e.target.value)} /></Field><label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-xs font-medium hover:bg-surface"><Upload className="h-4 w-4" /> {docFile ? "Archivo listo" : "Archivo"}<input type="file" className="sr-only" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} required /></label><button type="submit" className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background sm:col-span-3 sm:justify-self-end">Cargar documentación</button></form><div className="mt-4 divide-y divide-border rounded-xl border border-border">{docs.data?.map((document) => <div key={document.id} className="flex items-center gap-3 px-3 py-3"><FileText className="h-4 w-4 text-primary" /><div className="min-w-0 flex-1"><div className="truncate text-sm">{document.document_type} · {document.file_name}</div><div className="text-xs text-muted-foreground">{document.expiry_date ? `Vence ${document.expiry_date}` : "Sin vencimiento"}</div></div><button onClick={() => downloadDocument(document)} className="rounded-md p-2 text-muted-foreground hover:bg-surface"><Download className="h-4 w-4" /></button></div>)}{!docs.data?.length && <div className="px-3 py-5 text-center text-xs text-muted-foreground">Sin documentación cargada.</div>}</div></section>}
      </div></div>
  </div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium">{label}</span>{children}</label>; }
