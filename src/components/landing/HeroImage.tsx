import { motion } from "framer-motion";
import { Activity, FileCheck2, HardHat, ShieldCheck } from "lucide-react";

const checkpoints = [
  { label: "EPP", value: "OK" },
  { label: "Inspecciones", value: "24h" },
  { label: "Reportes", value: "Digital" },
];

export function HeroImage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.75, delay: 0.28, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="relative mx-auto w-full max-w-[520px]"
    >
      <div className="absolute -left-8 top-16 hidden h-28 w-28 rounded-full bg-[#1FA463]/16 blur-3xl md:block" />
      <div className="absolute -right-8 bottom-10 hidden h-36 w-36 rounded-full bg-[#0F7A45]/12 blur-3xl md:block" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/62 p-4 shadow-[0_34px_90px_-42px_rgba(15,122,69,0.52)] backdrop-blur-2xl">
        <div className="rounded-[1.55rem] border border-[#0F7A45]/10 bg-gradient-to-br from-white via-[#F8FBF9] to-[#DDF3E7] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0F7A45]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#1FA463]/55" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#111827]/14" />
            </div>
            <span className="rounded-full border border-[#0F7A45]/12 bg-white/70 px-3 py-1 text-xs font-semibold text-[#0F7A45]">
              ESIM OS
            </span>
          </div>

          <div className="mt-8 grid min-h-[360px] place-items-center rounded-[1.25rem] border border-white/80 bg-white/45 px-6 py-8 shadow-inner">
            <div className="relative grid aspect-[1680/638] w-[82%] place-items-center overflow-hidden rounded-[1.5rem] border border-[#0F7A45]/12 bg-white shadow-[0_28px_70px_-35px_rgba(15,122,69,0.9)]">
              <img
                src="/esim-institucional.png"
                alt="Imagen institucional de ESIM S.R.L."
                loading="lazy"
                decoding="async"
                className="relative h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {checkpoints.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-[#0F7A45]/10 bg-white/74 p-3 shadow-[0_10px_28px_-24px_rgba(17,24,39,0.65)]"
              >
                <div className="text-[11px] font-medium text-[#667085]">{item.label}</div>
                <div className="mt-1 text-sm font-semibold text-[#111827]">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -left-3 top-24 hidden rounded-2xl border border-white/70 bg-white/80 p-3 shadow-xl backdrop-blur-xl sm:block">
        <HardHat className="h-5 w-5 text-[#0F7A45]" aria-hidden="true" />
      </div>
      <div className="absolute -right-4 top-44 hidden rounded-2xl border border-white/70 bg-white/80 p-3 shadow-xl backdrop-blur-xl sm:block">
        <FileCheck2 className="h-5 w-5 text-[#0F7A45]" aria-hidden="true" />
      </div>
      <div className="absolute bottom-16 right-7 hidden items-center gap-2 rounded-full border border-white/70 bg-white/84 px-4 py-2 text-xs font-semibold text-[#111827] shadow-xl backdrop-blur-xl sm:flex">
        <Activity className="h-4 w-4 text-[#1FA463]" aria-hidden="true" />
        Tiempo real
      </div>
      <div className="absolute bottom-28 left-6 hidden items-center gap-2 rounded-full border border-white/70 bg-white/84 px-4 py-2 text-xs font-semibold text-[#111827] shadow-xl backdrop-blur-xl sm:flex">
        <ShieldCheck className="h-4 w-4 text-[#0F7A45]" aria-hidden="true" />
        Riesgo controlado
      </div>
    </motion.div>
  );
}
