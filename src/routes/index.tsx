import { createFileRoute, redirect } from "@tanstack/react-router";

import { Benefits } from "@/components/landing/Benefits";
import { CTA } from "@/components/landing/CTA";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f0f5ff] text-[#0f1a2e]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(59,130,246,0.12),transparent_32%),radial-gradient(circle_at_84%_14%,rgba(99,102,241,0.08),transparent_30%),linear-gradient(135deg,#f0f5ff_0%,#ffffff_48%,#e4edff_100%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[#3b82f6]/10 blur-3xl" />
      </div>

      <Header />
      <main>
        <Hero />
        <Benefits />
        <CTA />
      </main>
    </div>
  );
}
