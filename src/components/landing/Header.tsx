import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 12);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={cn(
        "sticky top-0 z-50 border-b border-transparent transition-all duration-300",
        isScrolled && "border-black/5 bg-white/80 shadow-sm backdrop-blur-xl",
      )}
    >
      <nav
        className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10"
        aria-label="Navegacion principal"
      >
        <Link to="/" className="group flex items-center gap-3" aria-label="Ir al inicio de ESIM">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-black/10 bg-white shadow-[0_12px_34px_-22px_rgba(15,122,69,0.65)] transition group-hover:scale-[1.03]">
            <ShieldCheck className="h-5 w-5 text-[#0F7A45]" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-[#111827]">ESIM S.R.L.</span>
            <span className="block text-xs font-medium text-[#667085]">
              Gestion Integral de Seguridad
            </span>
          </span>
        </Link>

        <Button
          asChild
          className="h-10 rounded-full bg-foreground px-5 text-sm text-background shadow-[0_16px_36px_-24px_rgba(17,24,39,0.7)] transition hover:scale-[1.02] hover:bg-primary"
        >
          <Link to="/auth" aria-label="Ingresar a la plataforma ESIM">
            Ingresar
          </Link>
        </Button>
      </nav>
    </motion.header>
  );
}
