import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="px-5 pb-20 pt-6 sm:px-8 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[1.75rem] border border-black/10 bg-surface px-6 py-8 shadow-[0_32px_80px_-48px_rgba(17,24,39,0.8)] sm:px-8 lg:flex-row lg:items-center lg:px-10"
      >
        <div>
          <p className="text-sm font-semibold uppercase text-primary">ESIM S.R.L.</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            Una primera impresion mas profesional para una operacion mas confiable.
          </h2>
        </div>

        <Button
          asChild
          className="h-12 shrink-0 rounded-full bg-foreground px-6 text-[15px] font-semibold text-background shadow-[0_18px_42px_-28px_rgba(255,255,255,0.65)] transition hover:scale-[1.02] hover:bg-primary"
        >
          <Link to="/auth" aria-label="Ingresar desde el llamado final">
            Ingresar
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}
