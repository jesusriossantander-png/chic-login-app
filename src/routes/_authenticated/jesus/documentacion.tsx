import { createFileRoute } from "@tanstack/react-router";
import { DocumentacionPage } from "@/components/pages/documentacion-page";

export const Route = createFileRoute("/_authenticated/jesus/documentacion")({
  component: JesusDocumentacionRoute,
});

function JesusDocumentacionRoute() {
  const { user } = Route.useRouteContext();
  return <DocumentacionPage user={user} />;
}
