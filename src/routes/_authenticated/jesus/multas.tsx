import { createFileRoute } from "@tanstack/react-router";
import { MultasPage } from "@/components/pages/multas-page";

export const Route = createFileRoute("/_authenticated/jesus/multas")({
  component: JesusMultasRoute,
});

function JesusMultasRoute() {
  const { user } = Route.useRouteContext();
  return <MultasPage user={user} />;
}
