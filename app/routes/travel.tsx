import type { MetaFunction } from "react-router";
import { PirateSailingGame } from "@/components/pirate-sailing-game";

export const meta: MetaFunction = () => [
  { title: "⛵ Sail the Seas | Calico Nino" },
  { name: "description", content: "An interactive pirate sailing experience." },
];

export default function TravelRoute() {
  return <PirateSailingGame />;
}
