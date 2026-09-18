import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: () => <Navigate to="/" search={{ variant: "A", game: false }} replace />,
});
