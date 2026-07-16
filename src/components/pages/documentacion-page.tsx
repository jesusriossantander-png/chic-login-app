import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Download, FileText, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const areas = ["SEG E HIG", "TALLER", "MECANIZADO", "VEHICULOS", "PLANTA"] as const;
type Area = (typeof areas)[number];

const LOCAL_DOCUMENTS_KEY = "safetydesk:documents";

type LocalDocument = {
  id: string;
  area: Area;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
};

function isMissingSupabaseTable(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "PGRST205";
}

function readLocal<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}

function writeLocal<T>(key: string, values: T[]) {
  localStorage.setItem(key, JSON.stringify(values));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DocumentacionPage({ user, adminOnly = true }: { user: User; adminOnly?: boolean }) {
  const qc = useQueryClient();
  const [selectedArea, setSelectedArea] = useState<Area>(areas[0]);
  const [openUpload, setOpenUpload] = useState(false);
  const [localMode, setLocalMode] = useState(true);

  const profile = useQuery({
    queryKey: ["profile", user.id],
    enabled: !localMode,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const documents = useQuery({
    queryKey: ["documents", selectedArea, localMode],
    queryFn: async () => {
      if (localMode) return readLocal<LocalDocument>(LOCAL_DOCUMENTS_KEY).filter((d) => d.area === selectedArea);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("area", selectedArea)
        .order("created_at", { ascending: false });
      if (error) {
        if (isMissingSupabaseTable(error)) { setLocalMode(true); return readLocal<LocalDocument>(LOCAL_DOCUMENTS_KEY).filter((d) => d.area === selectedArea); }
        throw error;
      }
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (document: LocalDocument) => {
      if (localMode) {
        writeLocal(LOCAL_DOCUMENTS_KEY, readLocal<LocalDocument>(LOCAL_DOCUMENTS_KEY).filter((d) => d.id !== document.id));
        return;
      }
      const { error: storageError } = await supabase.storage.from("documents").remove([document.file_path]);
      if (storageError) throw storageError;
      const { error } = await supabase.from("documents").delete().eq("id", document.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento eliminado");
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function download(document: LocalDocument) {
    if (localMode) {
      if (document.file_path.startsWith("data:")) {
        const link = window.document.createElement("a");
        link.href = document.file_path;
        link.download = document.file_name;
        link.click();
      } else {
        toast.info("Archivo disponible solo en el servidor");
      }
      return;
    }
    supabase.storage.from("documents").createSignedUrl(document.file_path, 300).then(({ data, error }) => {
      if (error) return toast.error(error.message);
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    });
  }

  const isAdmin = profile.data?.role === "admin";
  const canUpload = !adminOnly || isAdmin;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Biblioteca</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Documentación.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Material de consulta y capacitación organizado por área.
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setOpenUpload(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Subir documento
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-border bg-card p-3">
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Áreas</div>
          <div className="space-y-1">
            {areas.map((area) => (
              <button
                key={area}
                onClick={() => setSelectedArea(area)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                  selectedArea === area ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                {area === "TALLER" ? "TALLER." : area}
                <span className="text-xs">›</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">{selectedArea}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Documentos disponibles para consulta y descarga.</p>
          </div>
          {documents.isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : documents.data?.length ? (
            <div className="divide-y divide-border">
              {documents.data.map((document) => (
                <div key={document.id} className="flex items-center gap-3 px-5 py-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-primary"><FileText className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{document.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{document.file_name}{document.description ? ` · ${document.description}` : ""}</div>
                  </div>
                  <button onClick={() => download(document)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-surface" title="Descargar">
                    <Download className="h-4 w-4" /> <span className="hidden sm:inline">Descargar</span>
                  </button>
                  {isAdmin && <button onClick={() => confirm("¿Eliminar documento?") && remove.mutate(document)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Eliminar"><Trash2 className="h-4 w-4" /></button>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-surface text-muted-foreground"><FileText className="h-5 w-5" /></div>
              <p className="mt-3 text-sm text-muted-foreground">Todavía no hay documentos en esta área.</p>
              {canUpload && <button onClick={() => setOpenUpload(true)} className="mt-3 text-sm font-medium text-primary hover:underline">Subir el primero</button>}
            </div>
          )}
        </section>
      </div>

      {openUpload && <UploadModal area={selectedArea} userId={user.id} localMode={localMode} onClose={() => setOpenUpload(false)} />}
    </div>
  );
}

function UploadModal({ area, userId, localMode, onClose }: { area: Area; userId: string; localMode: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || !title.trim()) return toast.error("Completá el título y seleccioná un archivo");
    setLoading(true);
    try {
      if (localMode) {
        const dataUrl = await fileToDataUrl(file);
        const localDoc: LocalDocument = {
          id: crypto.randomUUID(), area, title: title.trim(),
          description: description.trim() || null, file_name: file.name,
          file_path: dataUrl, file_size: file.size,
          mime_type: file.type || "application/octet-stream",
          uploaded_by: userId, created_at: new Date().toISOString(),
        };
        writeLocal(LOCAL_DOCUMENTS_KEY, [...readLocal<LocalDocument>(LOCAL_DOCUMENTS_KEY), localDoc]);
        toast.success("Documento subido (local)");
        qc.invalidateQueries({ queryKey: ["documents"] });
        onClose();
        return;
      }
      const filePath = `${area}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("documents").insert({
        area, title: title.trim(), description: description.trim() || null,
        file_name: file.name, file_path: filePath, file_size: file.size,
        mime_type: file.type || "application/octet-stream", uploaded_by: userId,
      });
      if (error) {
        await supabase.storage.from("documents").remove([filePath]);
        throw error;
      }
      toast.success("Documento subido");
      qc.invalidateQueries({ queryKey: ["documents"] });
      onClose();
    } catch (error) {
      if (isMissingSupabaseTable(error)) {
        const dataUrl = await fileToDataUrl(file);
        const localDoc: LocalDocument = {
          id: crypto.randomUUID(), area, title: title.trim(),
          description: description.trim() || null, file_name: file.name,
          file_path: dataUrl, file_size: file.size,
          mime_type: file.type || "application/octet-stream",
          uploaded_by: userId, created_at: new Date().toISOString(),
        };
        writeLocal(LOCAL_DOCUMENTS_KEY, [...readLocal<LocalDocument>(LOCAL_DOCUMENTS_KEY), localDoc]);
        toast.success("Documento subido (local)");
        qc.invalidateQueries({ queryKey: ["documents"] });
        onClose();
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo subir el documento");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-lg overflow-hidden rounded-t-2xl border border-border bg-card shadow-[var(--shadow-elevated)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-base font-semibold">Subir documentación</h2><p className="mt-1 text-xs text-muted-foreground">Área: {area}</p></div><button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-surface"><X className="h-4 w-4" /></button></div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <label className="block"><span className="mb-1.5 block text-xs font-medium">Título</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Inducción de seguridad" required /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-medium">Descripción (opcional)</span><textarea className="input min-h-20 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descripción del material" /></label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 text-sm hover:bg-surface"><Upload className="h-5 w-5 text-primary" /><span className="min-w-0 flex-1 truncate text-muted-foreground">{file?.name ?? "Seleccionar archivo"}</span><input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required /></label>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />} Subir documento</button>
        </form>
      </div>
      <style>{`:where(.input) { width: 100%; border-radius: 0.5rem; border: 1px solid var(--color-border); background: var(--color-card); padding: 0.625rem 0.75rem; font-size: 0.875rem; outline: none; } .input:focus { border-color: var(--color-ring); box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.18); }`}</style>
    </div>
  );
}
