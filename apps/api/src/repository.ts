import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import type { Blueprint, BlueprintInput, ExecutionRecord, PromptArtifact } from "@the-vault/shared";

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
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS prompt_artifacts (
        id TEXT PRIMARY KEY, blueprint_id TEXT NOT NULL, generated_prompt TEXT NOT NULL,
        version INTEGER NOT NULL, created_at TEXT NOT NULL,
        FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS execution_records (
        id TEXT PRIMARY KEY, blueprint_id TEXT NOT NULL, prompt_artifact_id TEXT NOT NULL,
        status TEXT NOT NULL, output_location TEXT NOT NULL, verification_notes TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE CASCADE,
        FOREIGN KEY (prompt_artifact_id) REFERENCES prompt_artifacts(id) ON DELETE CASCADE
      );
    `);
  }

  createBlueprint(input: BlueprintInput): Blueprint {
    const now = new Date().toISOString();
    const blueprint: Blueprint = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
    this.db.prepare(`INSERT INTO blueprints
      (id,name,description,target_path,language,framework,dependencies_json,architecture_overview,core_logic,layout_design,constraints_json,created_at,updated_at)
      VALUES (@id,@name,@description,@targetPath,@language,@framework,@dependencies,@architectureOverview,@coreLogic,@layoutDesign,@constraints,@createdAt,@updatedAt)`)
      .run({ ...blueprint, dependencies: JSON.stringify(blueprint.dependencies), constraints: JSON.stringify(blueprint.constraints) });
    return blueprint;
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

  createExecutionRecord(blueprintId: string, promptArtifactId: string): ExecutionRecord {
    const record: ExecutionRecord = { id: randomUUID(), blueprintId, promptArtifactId, status: "pending", outputLocation: "", verificationNotes: "", createdAt: new Date().toISOString() };
    this.db.prepare(`INSERT INTO execution_records (id,blueprint_id,prompt_artifact_id,status,output_location,verification_notes,created_at) VALUES (?,?,?,?,?,?,?)`).run(record.id, record.blueprintId, record.promptArtifactId, record.status, record.outputLocation, record.verificationNotes, record.createdAt);
    return record;
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
      constraints: JSON.parse(String(row.constraints_json)) as string[], createdAt: String(row.created_at), updatedAt: String(row.updated_at)
    };
  }

  private mapPrompt(row: Record<string, unknown>): PromptRow {
    return { id: String(row.id), blueprintId: String(row.blueprint_id), generatedPrompt: String(row.generated_prompt), version: Number(row.version), createdAt: String(row.created_at) };
  }

  private mapExecution(row: Record<string, unknown>): ExecutionRow {
    return { id: String(row.id), blueprintId: String(row.blueprint_id), promptArtifactId: String(row.prompt_artifact_id), status: row.status as ExecutionRecord["status"], outputLocation: String(row.output_location), verificationNotes: String(row.verification_notes), createdAt: String(row.created_at) };
  }
}
