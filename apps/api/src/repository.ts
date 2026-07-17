import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import type { ArchitecturePacket, Blueprint, BlueprintInput, ExecutionRecord, ImplementationPlan, PromptArtifact, ProviderMetadata } from "@the-vault/shared";

type BlueprintRow = Blueprint;
type PromptRow = PromptArtifact;
type ExecutionRow = ExecutionRecord;

export class VaultRepository {
  private readonly db: Database.Database;

  constructor(databasePath = process.env.VAULT_DATABASE_PATH ?? "apps/api/data/vault.db") {
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
    this.db = new Database(databasePath);
    this.db.pragma("foreign_keys = ON");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS blueprints (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL,
        target_path TEXT NOT NULL, language TEXT NOT NULL, framework TEXT NOT NULL,
        dependencies_json TEXT NOT NULL, architecture_overview TEXT NOT NULL,
        core_logic TEXT NOT NULL, layout_design TEXT NOT NULL, constraints_json TEXT NOT NULL,
        implementation_plan_json TEXT NOT NULL DEFAULT '', architecture_packet_json TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'human', source_brief TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS prompt_artifacts (
        id TEXT PRIMARY KEY, blueprint_id TEXT NOT NULL, generated_prompt TEXT NOT NULL,
        version INTEGER NOT NULL, created_at TEXT NOT NULL,
        FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS execution_records (
        id TEXT PRIMARY KEY, blueprint_id TEXT NOT NULL, prompt_artifact_id TEXT NOT NULL,
        status TEXT NOT NULL, input_prompt TEXT NOT NULL DEFAULT '', generated_output TEXT NOT NULL DEFAULT '',
        artifact_type TEXT NOT NULL DEFAULT '', artifact_location TEXT NOT NULL DEFAULT '', output_location TEXT NOT NULL DEFAULT '',
        verification_notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, started_at TEXT, completed_at TEXT,
        provider_name TEXT, provider_model TEXT, provider_fallback INTEGER NOT NULL DEFAULT 0, provider_message TEXT, provider_duration_ms INTEGER,
        FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE,
        FOREIGN KEY (prompt_artifact_id) REFERENCES prompt_artifacts(id) ON DELETE CASCADE
      );
    `);
    this.ensureColumn("execution_records", "input_prompt", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("execution_records", "generated_output", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("execution_records", "artifact_type", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("execution_records", "artifact_location", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("execution_records", "started_at", "TEXT");
    this.ensureColumn("execution_records", "completed_at", "TEXT");
    this.ensureColumn("blueprints", "implementation_plan_json", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("blueprints", "architecture_packet_json", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("blueprints", "source", "TEXT NOT NULL DEFAULT 'human'");
    this.ensureColumn("blueprints", "source_brief", "TEXT NOT NULL DEFAULT ''");
    this.ensureColumn("execution_records", "provider_name", "TEXT");
    this.ensureColumn("execution_records", "provider_model", "TEXT");
    this.ensureColumn("execution_records", "provider_fallback", "INTEGER NOT NULL DEFAULT 0");
    this.ensureColumn("execution_records", "provider_message", "TEXT");
    this.ensureColumn("execution_records", "provider_duration_ms", "INTEGER");
  }

  createBlueprint(input: BlueprintInput): Blueprint {
    const now = new Date().toISOString();
    const blueprint: Blueprint = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.db.prepare(`INSERT INTO blueprints
      (id,name,description,target_path,language,framework,dependencies_json,architecture_overview,core_logic,layout_design,constraints_json,implementation_plan_json,architecture_packet_json,source,source_brief,created_at,updated_at)
      VALUES (@id,@name,@description,@targetPath,@language,@framework,@dependencies,@architectureOverview,@coreLogic,@layoutDesign,@constraints,@implementationPlan,@architecturePacket,@source,@sourceBrief,@createdAt,@updatedAt)`)
      .run({ ...blueprint, dependencies: JSON.stringify(blueprint.dependencies), constraints: JSON.stringify(blueprint.constraints), implementationPlan: blueprint.implementationPlan ? JSON.stringify(blueprint.implementationPlan) : "", architecturePacket: blueprint.architecturePacket ? JSON.stringify(blueprint.architecturePacket) : "", source: blueprint.source ?? "human", sourceBrief: blueprint.sourceBrief ?? "" });
    return blueprint;
  }

  updateBlueprint(id: string, input: BlueprintInput): Blueprint | undefined {
    const updatedAt = new Date().toISOString();
    this.db.prepare(`UPDATE blueprints SET name=@name, description=@description, target_path=@targetPath, language=@language, framework=@framework, dependencies_json=@dependencies, architecture_overview=@architectureOverview, core_logic=@coreLogic, layout_design=@layoutDesign, constraints_json=@constraints, implementation_plan_json=@implementationPlan, architecture_packet_json=@architecturePacket, source=@source, source_brief=@sourceBrief, updated_at=@updatedAt WHERE id=@id`).run({ id, ...input, dependencies: JSON.stringify(input.dependencies), constraints: JSON.stringify(input.constraints), implementationPlan: input.implementationPlan ? JSON.stringify(input.implementationPlan) : "", architecturePacket: input.architecturePacket ? JSON.stringify(input.architecturePacket) : "", source: input.source ?? "human", sourceBrief: input.sourceBrief ?? "", updatedAt });
    return this.getBlueprint(id);
  }

  listBlueprints(): Blueprint[] {
    return (this.db.prepare("SELECT * FROM blueprints ORDER BY created_at DESC").all() as Record<string, unknown>[]).map((row) => this.mapBlueprint(row));
  }

  getBlueprint(id: string): Blueprint | undefined {
    const row = this.db.prepare("SELECT * FROM blueprints WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.mapBlueprint(row) : undefined;
  }

  createPromptArtifact(blueprintId: string, generatedPrompt: string): PromptArtifact {
    const latest = this.db.prepare("SELECT MAX(version) as version FROM prompt_artifacts WHERE blueprint_id = ?").get(blueprintId) as { version: number | null };
    const artifact: PromptArtifact = { id: randomUUID(), blueprintId, generatedPrompt, version: (latest.version ?? 0) + 1, createdAt: new Date().toISOString() };
    this.db.prepare(`INSERT INTO prompt_artifacts (id,blueprint_id,generated_prompt,version,created_at) VALUES (?,?,?,?,?)`).run(artifact.id, artifact.blueprintId, artifact.generatedPrompt, artifact.version, artifact.createdAt);
    return artifact;
  }

  getLatestPromptArtifact(blueprintId: string): PromptArtifact | undefined {
    const row = this.db.prepare("SELECT * FROM prompt_artifacts WHERE blueprint_id = ? ORDER BY version DESC LIMIT 1").get(blueprintId) as Record<string, unknown> | undefined;
    return row ? this.mapPrompt(row) : undefined;
  }

  getPromptArtifact(id: string): PromptArtifact | undefined {
    const row = this.db.prepare("SELECT * FROM prompt_artifacts WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.mapPrompt(row) : undefined;
  }

  createExecutionRecord(blueprintId: string, promptArtifactId: string, inputPrompt = ""): ExecutionRecord {
    const record: ExecutionRecord = { id: randomUUID(), blueprintId, promptArtifactId, status: "pending", inputPrompt, generatedOutput: "", artifactType: "", artifactLocation: "", outputLocation: "", verificationNotes: "", createdAt: new Date().toISOString(), startedAt: null, completedAt: null };
    this.db.prepare(`INSERT INTO execution_records (id,blueprint_id,prompt_artifact_id,status,input_prompt,generated_output,artifact_type,artifact_location,output_location,verification_notes,created_at,started_at,completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(record.id, record.blueprintId, record.promptArtifactId, record.status, record.inputPrompt, record.generatedOutput, record.artifactType, record.artifactLocation, record.outputLocation, record.verificationNotes, record.createdAt, record.startedAt, record.completedAt);
    return record;
  }

  markExecutionRunning(id: string, startedAt = new Date().toISOString()): ExecutionRecord | undefined {
    this.db.prepare("UPDATE execution_records SET status = 'running', started_at = ? WHERE id = ?").run(startedAt, id);
    return this.getExecutionRecord(id);
  }

  completeExecution(id: string, generatedOutput: string, artifactType: string, artifactLocation = "", completedAt = new Date().toISOString(), provider?: ProviderMetadata): ExecutionRecord | undefined {
    this.db.prepare("UPDATE execution_records SET status = 'completed', generated_output = ?, artifact_type = ?, artifact_location = ?, output_location = ?, completed_at = ?, provider_name = ?, provider_model = ?, provider_fallback = ?, provider_message = ?, provider_duration_ms = ? WHERE id = ?").run(generatedOutput, artifactType, artifactLocation, artifactLocation, completedAt, provider?.name ?? null, provider?.model ?? null, provider?.fallback ? 1 : 0, provider?.message ?? null, provider?.durationMs ?? null, id);
    return this.getExecutionRecord(id);
  }

  failExecution(id: string, verificationNotes: string, completedAt = new Date().toISOString()): ExecutionRecord | undefined {
    this.db.prepare("UPDATE execution_records SET status = 'failed', verification_notes = ?, completed_at = ? WHERE id = ?").run(verificationNotes, completedAt, id);
    return this.getExecutionRecord(id);
  }

  addVerificationNotes(id: string, verificationNotes: string): ExecutionRecord | undefined {
    this.db.prepare("UPDATE execution_records SET verification_notes = ? WHERE id = ?").run(verificationNotes, id);
    return this.getExecutionRecord(id);
  }

  getExecutionRecord(id: string): ExecutionRecord | undefined {
    const row = this.db.prepare("SELECT * FROM execution_records WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.mapExecution(row) : undefined;
  }

  listExecutionRecords(blueprintId: string): ExecutionRecord[] {
    return (this.db.prepare("SELECT * FROM execution_records WHERE blueprint_id = ? ORDER BY created_at DESC").all(blueprintId) as Record<string, unknown>[]).map((row) => this.mapExecution(row));
  }

  close(): void { this.db.close(); }

  private mapBlueprint(row: Record<string, unknown>): BlueprintRow {
    return {
      id: String(row.id), name: String(row.name), description: String(row.description), targetPath: String(row.target_path),
      language: String(row.language), framework: String(row.framework), dependencies: JSON.parse(String(row.dependencies_json)) as string[],
      architectureOverview: String(row.architecture_overview), coreLogic: String(row.core_logic), layoutDesign: String(row.layout_design),
      constraints: JSON.parse(String(row.constraints_json)) as string[],
      implementationPlan: row.implementation_plan_json ? JSON.parse(String(row.implementation_plan_json)) as ImplementationPlan : undefined,
      architecturePacket: row.architecture_packet_json ? JSON.parse(String(row.architecture_packet_json)) as ArchitecturePacket : undefined,
      source: row.source === "ollama" || row.source === "mock" ? row.source : "human",
      sourceBrief: String(row.source_brief ?? "") || undefined,
      createdAt: String(row.created_at), updatedAt: String(row.updated_at)
    };
  }

  private mapPrompt(row: Record<string, unknown>): PromptRow {
    return { id: String(row.id), blueprintId: String(row.blueprint_id), generatedPrompt: String(row.generated_prompt), version: Number(row.version), createdAt: String(row.created_at) };
  }

  private mapExecution(row: Record<string, unknown>): ExecutionRow {
    const providerName = row.provider_name ? String(row.provider_name) : "";
    return { id: String(row.id), blueprintId: String(row.blueprint_id), promptArtifactId: String(row.prompt_artifact_id), status: row.status as ExecutionRecord["status"], inputPrompt: String(row.input_prompt ?? ""), generatedOutput: String(row.generated_output ?? ""), artifactType: String(row.artifact_type ?? ""), artifactLocation: String(row.artifact_location ?? row.output_location ?? ""), outputLocation: String(row.output_location ?? ""), verificationNotes: String(row.verification_notes ?? ""), provider: providerName ? { name: providerName, model: row.provider_model ? String(row.provider_model) : undefined, fallback: Boolean(row.provider_fallback), message: row.provider_message ? String(row.provider_message) : undefined, durationMs: row.provider_duration_ms == null ? undefined : Number(row.provider_duration_ms) } : undefined, createdAt: String(row.created_at), startedAt: row.started_at ? String(row.started_at) : null, completedAt: row.completed_at ? String(row.completed_at) : null };
  }

  private ensureColumn(table: string, column: string, definition: string): void {
    const columns = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!columns.some((candidate) => candidate.name === column)) this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}
