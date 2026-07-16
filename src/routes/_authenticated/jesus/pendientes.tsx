import { createFileRoute } from "@tanstack/react-router";
import { PendientesPage } from "@/components/pages/pendientes-page";

export const Route = createFileRoute("/_authenticated/jesus/pendientes")({
  component: JesusPendientesRoute,
});

function JesusPendientesRoute() {
  const { user } = Route.useRouteContext();
  return <PendientesPage user={user} />;
}
