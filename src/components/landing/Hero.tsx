import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { HeroImage } from "@/components/landing/HeroImage";
import { Button } from "@/components/ui/button";

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:pb-24 lg:pt-14">
      <div className="order-2 max-w-3xl lg:order-1">
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.12, delayChildren: 0.05 }}
        >
          <motion.div
            variants={item}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-[#0F7A45]/12 bg-white/68 px-3.5 py-2 text-sm font-semibold text-[#0F7A45] shadow-[0_14px_36px_-30px_rgba(15,122,69,0.7)] backdrop-blur-xl"
          >
            <span className="h-2 w-2 rounded-full bg-[#1FA463]" />
            Seguridad Industrial, Higiene y Medio Ambiente
          </motion.div>

          <motion.h1
            variants={item}
            transition={{ duration: 0.62, ease: "easeOut" }}
            className="mt-7 max-w-4xl text-[44px] font-semibold leading-[0.98] tracking-normal text-[#111827] sm:text-[56px] lg:text-[64px]"
          >
            Gestion Inteligente de
            <span className="block text-[#0F7A45]">Seguridad Industrial</span>
          </motion.h1>

          <motion.p
            variants={item}
            transition={{ duration: 0.62, ease: "easeOut" }}
            className="mt-7 max-w-2xl text-[18px] leading-8 text-[#667085] sm:text-[22px] sm:leading-9"
          >
            Centraliza inspecciones, reportes, equipos de proteccion, gestion documental y procesos
            de seguridad desde una plataforma moderna.
          </motion.p>

          <motion.div
            variants={item}
            transition={{ duration: 0.62, ease: "easeOut" }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              asChild
              className="h-12 rounded-full bg-gradient-to-r from-[#0F7A45] to-[#1FA463] px-6 text-[15px] font-semibold text-white shadow-[0_20px_46px_-25px_rgba(15,122,69,0.9)] transition hover:scale-[1.02] hover:from-[#0B673A] hover:to-[#178B54]"
            >
              <Link to="/auth" aria-label="Ingresar a la plataforma">
                Ingresar
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-[#0F7A45]/16 bg-white/68 px-6 text-[15px] font-semibold text-[#111827] shadow-[0_18px_40px_-30px_rgba(17,24,39,0.65)] backdrop-blur-xl transition hover:scale-[1.02] hover:bg-white hover:text-[#0F7A45]"
            >
              <a href="#beneficios" aria-label="Conocer la plataforma ESIM">
                Conocer la plataforma
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <div className="order-1 lg:order-2">
        <HeroImage />
      </div>
    </section>
  );
}
