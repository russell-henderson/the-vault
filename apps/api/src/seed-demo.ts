import { VaultRepository } from "./repository.js";

const demoBlueprint = {
  name: "AI Dashboard Analytics Panel",
  description: "A responsive analytics panel that gives product teams a clear, accessible view of dashboard activity.",
  targetPath: "src/components/AnalyticsPanel.tsx",
  language: "TypeScript",
  framework: "React + Tailwind CSS",
  dependencies: ["analytics-api", "shared-ui"],
  architectureOverview: "A presentational React component that consumes an analytics API through a typed boundary and exposes loading, error, and ready states.",
  coreLogic: "Fetch and render summary metrics, preserve a clear API boundary, and keep server persistence outside the component.",
  layoutDesign: "Responsive card layout with readable metric hierarchy, keyboard-accessible controls, and a compact mobile arrangement.",
  constraints: ["Handle loading and API error states explicitly.", "Do not own server persistence.", "Meet accessibility expectations for keyboard and screen-reader users."]
};

const repository = new VaultRepository();
const existing = repository.listBlueprints().find((blueprint) => blueprint.name === demoBlueprint.name);
const blueprint = existing ?? repository.createBlueprint(demoBlueprint);
console.log(existing ? `Demo blueprint already exists: ${blueprint.id}` : `Created demo blueprint: ${blueprint.id}`);
console.log("Open the dashboard, select the blueprint, and walk through prompt generation, execution, and verification.");
repository.close();
