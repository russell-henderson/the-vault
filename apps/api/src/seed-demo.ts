import { VaultRepository } from "./repository.js";
import type { BlueprintInput } from "@the-vault/shared";

const demoBlueprint: BlueprintInput = {
  name: "AI Dashboard Analytics Panel",
  description: "A responsive analytics panel that gives product teams a clear, accessible view of dashboard activity.",
  targetPath: "src/components/AnalyticsPanel.tsx",
  language: "TypeScript",
  framework: "React + Tailwind CSS",
  dependencies: ["analytics-api", "shared-ui"],
  architectureOverview: "A presentational React component that consumes an analytics API through a typed boundary and exposes loading, error, and ready states.",
  coreLogic: "Fetch and render summary metrics, preserve a clear API boundary, and keep server persistence outside the component.",
  layoutDesign: "Responsive card layout with readable metric hierarchy, keyboard-accessible controls, and a compact mobile arrangement.",
  constraints: ["Handle loading and API error states explicitly.", "Do not own server persistence.", "Meet accessibility expectations for keyboard and screen-reader users."],
  tags: [],
  implementationPlan: {
    summary: "Create a bounded, accessible analytics panel with a typed data boundary and explicit UI states.",
    steps: ["Define the analytics view model and API adapter contract.", "Build loading, error, empty, and ready states.", "Verify responsive layout and keyboard behavior."],
    filesToTouch: ["src/components/AnalyticsPanel.tsx", "src/api/analytics.ts", "tests/AnalyticsPanel.test.tsx"],
    assumptions: ["The application owns API persistence."],
    acceptanceCriteria: ["Every data state is visible.", "No persistence is introduced in the component.", "Keyboard navigation is verified."]
  },
  source: "human"
};

const repository = new VaultRepository(process.env.VAULT_DATABASE_PATH ?? "apps/api/data/vault.db");
const existing = repository.listBlueprints().find((blueprint) => blueprint.name === demoBlueprint.name);
const blueprint = existing ? (existing.implementationPlan ? existing : repository.updateBlueprint(existing.id, demoBlueprint)!) : repository.createBlueprint(demoBlueprint);
console.log(existing ? `Demo blueprint ready: ${blueprint.id}` : `Created demo blueprint: ${blueprint.id}`);
console.log("Open the dashboard, select the blueprint, and walk through prompt generation, execution, and verification.");
repository.close();
