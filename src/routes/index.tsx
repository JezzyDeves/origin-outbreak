import { createFileRoute } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { HomeScreen } from "@/components/home-screen";
import { DiseaseLab } from "@/components/disease-lab";
import { SeedLab } from "@/components/seed-lab";
import { SimView } from "@/components/sim-view";

export const Route = createFileRoute("/")({ component: App });

function App() {
  const step = useApp((s) => s.step);
  if (step === "lab") return <DiseaseLab />;
  if (step === "seed") return <SeedLab />;
  if (step === "run") return <SimView />;
  return <HomeScreen />;
}
