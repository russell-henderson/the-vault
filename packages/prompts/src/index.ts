import type { Blueprint } from "@the-vault/shared";

export function generateCodexPrompt(blueprint: Blueprint): string {
  const list = (items: string[]) => items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- None specified";

  return [
    "# Codex Implementation Brief",
    "",
    "Implement the following component while preserving every stated constraint.",
    "",
    "## Component",
    `Name: ${blueprint.name}`,
    `Target path: ${blueprint.targetPath}`,
    `Language: ${blueprint.language}`,
    `Framework: ${blueprint.framework}`,
    "",
    "## Description",
    blueprint.description,
    "",
    "## Architecture overview",
    blueprint.architectureOverview,
    "",
    "## Core logic",
    blueprint.coreLogic,
    "",
    "## Layout and UI design",
    blueprint.layoutDesign,
    "",
    "## Dependencies",
    list(blueprint.dependencies),
    "",
    "## Constraints",
    list(blueprint.constraints),
    "",
    "## Required response",
    "1. Summarize the implementation approach.",
    "2. List the files to create or modify.",
    "3. Provide the implementation artifact or patch.",
    "4. Explain how each constraint is preserved.",
    "5. State verification steps and any unresolved assumptions.",
    "",
    "Do not expand scope, add dependencies, or change public contracts without calling it out explicitly."
  ].join("\n");
}
