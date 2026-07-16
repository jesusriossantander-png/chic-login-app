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
    <div className="min-h-screen overflow-hidden bg-white text-[#0f1a2e]">

      <Header />
      <main>
        <Hero />
        <Benefits />
        <CTA />
      </main>
    </div>
  );
}
