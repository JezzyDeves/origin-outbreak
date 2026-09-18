import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { HomeScreen } from "@/components/home-screen";
import { DiseaseLab } from "@/components/disease-lab";
import { SeedLab } from "@/components/seed-lab";
import { SimView } from "@/components/sim-view";
import { MapLookPrototype, type MapLookKey } from "@/components/map-look-prototype";

function parseVariant(v: unknown): MapLookKey {
  if (v === "B" || v === "C" || v === "A") return v;
  return "A";
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    variant: parseVariant(search.variant),
    game: search.game === true || search.game === "1",
  }),
  component: App,
});

function App() {
  const { variant, game } = Route.useSearch();
  const navigate = Route.useNavigate();
  const step = useApp((s) => s.step);

  if (!game) {
    return (
      <MapLookPrototype
        variant={variant}
        onVariant={(key) => {
          void navigate({ search: { variant: key, game: false }, replace: true });
        }}
      />
    );
  }

  if (step === "lab") return <DiseaseLab />;
  if (step === "seed") return <SeedLab />;
  if (step === "run") return <SimView />;
  return <HomeScreen />;
}
