import { createFileRoute } from "@tanstack/react-router";
import { MultasPage } from "@/components/pages/multas-page";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/jesus/multas")({
  component: JesusMultasRoute,
  validateSearch: z.object({ q: z.string().optional() }).parse,
});

function JesusMultasRoute() {
  const { user } = Route.useRouteContext();
  const { q } = Route.useSearch();
  return <MultasPage user={user} searchQuery={q} />;
}
