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
    <div className="min-h-screen overflow-hidden bg-[#F8FBF9] text-[#111827]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(31,164,99,0.16),transparent_32%),radial-gradient(circle_at_84%_14%,rgba(15,122,69,0.12),transparent_30%),linear-gradient(135deg,#F8FBF9_0%,#FFFFFF_48%,#EEF7F1_100%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[#1FA463]/10 blur-3xl" />
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
