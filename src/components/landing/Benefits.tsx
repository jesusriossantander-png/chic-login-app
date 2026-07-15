import { Activity, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";

import { FeatureCard } from "@/components/landing/FeatureCard";

const features = [
  {
    title: "Seguridad Industrial",
    description: "Estandariza controles, responsables y evidencia critica en cada operacion.",
    icon: ShieldCheck,
  },
  {
    title: "Inspecciones",
    description: "Ordena recorridos, hallazgos y acciones correctivas con trazabilidad clara.",
    icon: ClipboardCheck,
  },
  {
    title: "Reportes",
    description: "Convierte datos operativos en informes consistentes, listos para revisar.",
    icon: FileText,
  },
  {
    title: "Tiempo Real",
    description: "Consulta estados, prioridades y avances sin depender de planillas dispersas.",
    icon: Activity,
  },
];

export function Benefits() {
  return (
    <section id="beneficios" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase text-[#0F7A45]">Plataforma ESIM</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-normal text-[#111827] sm:text-4xl">
          Procesos de seguridad mas claros, conectados y auditables.
        </h2>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
}
