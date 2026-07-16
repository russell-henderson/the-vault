# The Vault Architect — Demo Story

The problem is not that AI cannot generate code. The problem is that architecture, constraints, and verification are easy to lose when intent becomes an implementation request.

Vault Architect makes that handoff visible. A human describes the **AI Dashboard Analytics Panel** in a natural-language brief. A local Ollama model proposes a structured blueprint: React + TypeScript + Tailwind, API integration, responsive layout, loading and error states, and accessibility requirements. The human reviews and approves the proposal, the system validates and stores the resulting architecture packet, compiles it into a deterministic Codex-ready prompt, launches a local provider execution, and keeps the output and verification note attached to the original intent.

The result is a small but meaningful workflow: human architecture remains authoritative, AI assistance is replaceable, the end goal is visible before execution, and every generated result has evidence that a reviewer can inspect. When Ollama is unavailable, the deterministic mock is available as an explicit fallback rather than a disguised substitute.

The final demo script is in [demo-script.md](demo-script.md).
