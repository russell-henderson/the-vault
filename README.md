

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/119ae169-9823-44bc-a3d6-c3bc23ee6e38" />

---


# The Vault Architect

**v1.0.0 · Local-first architecture orchestration for reviewable AI-assisted development**

The Vault Architect turns a human brief into a bounded, reviewable engineering handoff. It keeps intent, constraints, architecture decisions, generated documents, provider metadata, and verification evidence connected from the first brief through the final artifact.

```text
Brief → Discover → Auto-advance or Review → Synthesize → Approve → Compile → Stream → Verify
```

The product is deliberately human-governed. Providers propose content; the user confirms the direction, approves the blueprint, reviews generated documents, and records verification evidence.

## What is in the current release

- **Guided architecture workflow:** write a brief, auto-advance to a proposal when discovery is highly confident, or inspect registry-backed recommendations and confirm a generator when review is required.
- **Authority boundaries:** explicit constraints, unsupported technologies, ambiguous intent, and incompatible generators stop at `Review Required` before provider synthesis or persistence.
- **Provider-neutral generation:** use local Ollama models or the deterministic mock provider. Analysis and creation models can be selected independently.
- **Prompt and execution evidence:** compile deterministic prompt artifacts, launch bounded executions, inspect generated output and provider metadata, and record human verification notes.
- **Real-time document workspace:** generate PRD, architecture, API, data-model, component, development-plan, testing-strategy, deployment, and troubleshooting documents through SSE; reroll one document without disturbing the others, edit locally, and export Markdown or ZIP bundles.
- **Premium blueprint vault:** manage tags, rename records, delete single or selected blueprints, filter by canonical tags, and personalize cards with browser-local cover art.
- **Local-first cover customization:** PNG, JPEG, and WebP covers are resized in the browser and stored in IndexedDB by blueprint ID. They never enter SQLite, provider prompts, or the server API.
- **Traceable operations:** the API persists blueprints, packets, prompt artifacts, execution records, provider metadata, and verification notes in SQLite.

## Architecture at a glance

```text
React + Vite + Tailwind
  ├─ Dashboard / Brief Composer / Proposal Review
  ├─ Blueprint Detail / Document Workspace
  └─ IndexedDB cover art + client-side exports
          │ HTTP + SSE
Fastify API + shared Zod contracts
  ├─ Discovery and authority orchestration
  ├─ Generator registry and Architecture Packet V2
  ├─ Prompt compilation and execution lifecycle
  └─ SQLite repository
          │ bounded provider adapter
Ollama (local) or deterministic mock
```

Registered generator definitions currently cover:

- `swift-spritekit` — mobile physics with Swift and SpriteKit;
- `python-flet` — desktop UI with Python and Flet;
- `react-typescript` — web dashboards with React and TypeScript/Tailwind.

## Local setup

Requirements: Node.js 20+ and npm 10+.

```bash
npm install
npm run typecheck
npm run build
npm test
```

Start the services in separate terminals:

```bash
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:5173
```

The API stores SQLite data at `apps/api/data/vault.db`. Set `VAULT_DATABASE_PATH` to use another location.

### Ollama

Ollama is optional. The deterministic mock works without it.

```bash
ollama serve
ollama pull llama3.2:3b
ollama pull dolphin3:8b
```

Configure the API with `.env.example` values or environment variables:

```bash
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
# For direct Ollama Cloud access from a hosted API, use https://ollama.com and set OLLAMA_API_KEY server-side.
# OLLAMA_API_KEY=your-ollama-cloud-key
# Choose the analysis and creation models from the dashboard catalog.
# Optional preconfiguration: OLLAMA_ANALYSIS_MODEL=... and OLLAMA_CREATION_MODEL=...
# Optional embedding evaluation: OPENROUTER_API_KEY=...
```

The dashboard reports provider health and requires an explicit model choice for each generation role. Refresh the catalog after pulling or enabling a model in Ollama. Cloud-tagged Ollama models are shown with a cloud label and can be selected. For a Vercel-hosted API, set `OLLAMA_BASE_URL=https://ollama.com` and the server-side `OLLAMA_API_KEY`; a local API can continue using `http://localhost:11434` with Ollama sign-in handling cloud access. If `OPENROUTER_API_KEY` is configured, the dashboard also exposes the multimodal embedding model `nvidia/llama-nemotron-embed-vl-1b-v2:free` as a separate evaluation choice.

## Connecting Your Local API or Companion

The hosted workspace at `https://the-vault-dusky.vercel.app` is a static client. It does not host your SQLite data, local API, or Ollama service. Unpaired visitors start in Ephemeral Mode; choose **Saved API / Companion mode** when you want durable blueprints, history, or disk synchronization.

### Local Companion (Recommended)

1. Download the latest **Vault Companion for Windows** installer from the [project releases](https://github.com/russell-henderson/the-vault/releases). Use `Vault Companion Setup 1.0.4.exe` or newer; do not use `1.0.0`–`1.0.3` preview installers. Preview installers may be unsigned and should be published as pre-releases until Windows code signing is configured.
2. Run the installer, then open **Vault Companion** from the Windows Start menu. It opens a visible desktop window containing the same saved Vault workspace as the hosted site, paired to its own local API and database.
3. You can also select **Connect Local Companion** on the hosted connection screen. Windows opens the installed companion through `vault-companion://open`; approve the browser/Windows protocol prompt if shown. Keep the companion window open while using its saved workspace.
4. The first time the companion opens, its empty Vault screen confirms the local database is ready and prompts you to create the first saved blueprint. For local models, start Ollama and pull a model as usual. The companion connects only to `http://localhost:11434` and offers the deterministic mock when Ollama is unavailable.

The companion binds only to your loopback interface and stores its database at `%LOCALAPPDATA%\The Vault Architect\vault.db`. Blueprint records, generated documents, and local-model prompts do not pass through Vercel or a cloud provider.

### Custom API Endpoint

Advanced users can select **Use Custom API** on the connection screen and enter a Vault-compatible HTTPS backend URL, plus an optional bearer token. The endpoint must implement the Vault API contract (including `GET /api/connection-info`) and allow the production origin `https://the-vault-dusky.vercel.app` with its own CORS and authentication policy. Endpoint preferences may be remembered; bearer tokens are retained only for the open browser tab.

### Browser permission troubleshooting

Chromium browsers may show a **Local Network Access** permission prompt when the secure Vercel site connects to `127.0.0.1`. Allow the prompt to pair with Vault Companion. If the connection later fails, reopen Vault Companion and pair again; pairing tokens are short-lived and are cleared when the browser tab closes. If Ollama is offline, start `ollama serve` or choose the deterministic mock.

## Ephemeral browser generation

Visitors who have not paired an API start in **Ephemeral Mode**. This browser-only workspace generates an architecture, can turn that architecture into selected implementation documents, and lets you download the document workspace as a ZIP. It never creates a Vault record, SQLite database, history entry, disk-sync request, or saved credential. Refreshing or closing the tab clears the generated work and provider session.

1. Choose **Local Ollama** or **OpenRouter**, then select a model.
2. Describe the system and select **Generate architecture**.
3. Select the implementation documents you need, then choose **Generate selected documents**. Each document uses the generated architecture as context.
4. Download `ARCHITECTURE.md` directly or choose **Download workspace ZIP** before leaving the page.

Choose **Local Ollama** to use any model already running at `http://127.0.0.1:11434`; no model token is needed. The picker loads every model returned by `ollama list`, and **Retry local models** reloads the catalog after you start Ollama or grant permission. A hosted secure page may need permission to reach loopback. If Chromium reports a blocked connection, restart Ollama with the production origin allowed:

```bash
OLLAMA_ORIGINS="https://the-vault-dusky.vercel.app" ollama serve
```

In PowerShell:

```powershell
$env:OLLAMA_ORIGINS="https://the-vault-dusky.vercel.app"
ollama serve
```

Allow the Chromium **Local Network Access** prompt. If the catalog remains blocked, enter any installed model ID (for example `llama3.2:3b`) in **Local Ollama model ID**; direct generation can then proceed once the browser is permitted to reach Ollama. `OLLAMA_ORIGINS="*"` is suitable only for temporary local troubleshooting, not normal use.

Choose **OpenRouter** to authorize through its OAuth page. The PKCE verifier lives in `sessionStorage` only while the browser redirects; the returned session key remains only in page memory and is lost on refresh. If OAuth is unavailable in a browser, users may instead paste an existing OpenRouter API key; it is used only in memory for that tab and is never written to browser storage. If model discovery cannot load, enter a model ID such as `openrouter/auto` in the **OpenRouter model ID** field. Select **Saved API / Companion mode** whenever you need blueprints, history, or local disk synchronization.

## Saved workflow walkthrough

Use this workflow after connecting a Companion or Vault-compatible custom API. It creates durable blueprint records and is distinct from Ephemeral Mode.

1. Select **Start with a brief** and describe the intended outcome and constraints.
2. Run discovery. High-confidence registered results synthesize a proposal automatically; otherwise compare options, confirm the intended generator, and review the proposal.
3. Select **Approve & save blueprint** to persist the blueprint and Architecture Packet V2.
4. Compile the deterministic prompt artifact and choose the creation provider/model.
5. Generate the PRD and selected core documents, then open the workspace.
6. Review the live SSE stream, edit or reroll a document, and export the completed workspace.
7. Return to the vault to tag, rename, cover, review, or delete blueprint records.

## API surface

| Area | Routes |
| --- | --- |
| Provider state | `GET /api/providers/status`, `GET /api/providers/models` |
| Discovery | `POST /api/architecture-discovery`, `POST /api/blueprint-proposals` |
| Blueprints | `POST/GET /api/blueprints`, `GET/PATCH/DELETE /api/blueprints/:id`, `POST /api/blueprints/bulk-delete` |
| Prompts | `POST /api/blueprints/:id/generate-prompt`, `GET /api/blueprints/:id/prompt` |
| Workspace | `GET /api/blueprints/:id/workspace`, `POST /api/blueprints/:id/generate-core-docs`, `POST /api/blueprints/:id/reroll-doc` |
| Streaming | `GET /api/blueprints/:id/generate/stream?filename=README.md&provider=mock&model=deterministic-local` |
| Execution | `POST /api/executions`, `GET /api/executions/:id`, `POST /api/executions/:id/verify` |

The SSE endpoint emits `data: {"chunk":"..."}` frames and ends with `data: {"status":"DONE"}`. Errors are emitted as structured error events and are shown in the workspace without persisting an incomplete document as completed output.

## Verification status

The current checks pass:

```text
npm run typecheck  ✓
npm test           ✓ 96 tests
npm run build      ✓
```

The full suite, including database-backed checks, passes in the current workspace.

## Boundaries and non-goals

- No multi-user accounts, permissions, or collaboration model.
- No autonomous repository mutation or unreviewed code merge.
- No unrestricted agent shell or workspace access.
- No server-side persistence for browser-local cover art.

## Documentation

- [Documentation index](docs/README.md)
- [Canonical architecture](docs/architecture.md)
- [Product and development plan](docs/development-plan.md)
- [Demo script](docs/demo-script.md)
- [Submission notes](docs/submission-notes.md)
- [Architecture decision record](docs/adr/ADR-001-authority-model.md)
- [Build log](BUILD_LOG.md)
- [Historical reports](docs/reports/)

## Release

The current local release is `v1.0.0`, merged into local `main`. Remote push and pull-request publication remain intentionally separate actions.
