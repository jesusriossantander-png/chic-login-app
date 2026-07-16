import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/jesus")({
  component: JesusLayout,
});

function JesusLayout() {
  return <Outlet />;
}
