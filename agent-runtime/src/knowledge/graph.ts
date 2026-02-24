/**
 * Knowledge Graph backed by SQLite.
 * Entity extraction via generic LLM function dependency.
 */

import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";

export interface KGNode {
  id: number;
  name: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface KGEdge {
  id: number;
  sourceId: number;
  targetId: number;
  relationship: string;
  properties: Record<string, unknown>;
}

export interface EntityExtractionResult {
  entities: Array<{ name: string; type: string; properties?: Record<string, unknown> }>;
  relationships: Array<{
    source: string;
    target: string;
    relationship: string;
    properties?: Record<string, unknown>;
  }>;
}

type LLMCallFn = (prompt: string) => Promise<string>;

export class KnowledgeGraph {
  private db: Database.Database;

  constructor(dataDir: string, agentId = "default") {
    const dir = path.join(dataDir, "knowledge");
    fs.mkdirSync(dir, { recursive: true });

    this.db = new Database(path.join(dir, `${agentId}_graph.db`));
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kg_nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        properties_json TEXT NOT NULL DEFAULT '{}',
        UNIQUE(name, type)
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS kg_edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL REFERENCES kg_nodes(id),
        target_id INTEGER NOT NULL REFERENCES kg_nodes(id),
        relationship TEXT NOT NULL,
        properties_json TEXT NOT NULL DEFAULT '{}',
        UNIQUE(source_id, target_id, relationship)
      )
    `);
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_nodes_name ON kg_nodes(name)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_edges_source ON kg_edges(source_id)");
    this.db.exec("CREATE INDEX IF NOT EXISTS idx_edges_target ON kg_edges(target_id)");
  }

  async extractEntities(text: string, llmCall: LLMCallFn): Promise<EntityExtractionResult> {
    const prompt = `Extract entities and relationships from the following text. Return ONLY valid JSON matching this schema:
{
  "entities": [{"name": "string", "type": "string"}],
  "relationships": [{"source": "entity name", "target": "entity name", "relationship": "string"}]
}

Entity types: person, organization, concept, technology, location, event, document, other.
Be concise. Only extract clearly stated entities.

Text:
${text.slice(0, 4000)}`;

    const response = await llmCall(prompt);

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { entities: [], relationships: [] };

    try {
      const parsed = JSON.parse(jsonMatch[0]) as EntityExtractionResult;
      return {
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
        relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
      };
    } catch {
      return { entities: [], relationships: [] };
    }
  }

  addEntity(name: string, type: string, properties: Record<string, unknown> = {}): number {
    const stmt = this.db.prepare(`
      INSERT INTO kg_nodes (name, type, properties_json)
      VALUES (?, ?, ?)
      ON CONFLICT(name, type) DO UPDATE SET properties_json = excluded.properties_json
      RETURNING id
    `);
    const row = stmt.get(name, type, JSON.stringify(properties)) as { id: number };
    return row.id;
  }

  addEntities(entities: Array<{ name: string; type: string; properties?: Record<string, unknown> }>): number[] {
    return entities.map((e) => this.addEntity(e.name, e.type, e.properties ?? {}));
  }

  addRelationship(
    sourceName: string,
    targetName: string,
    relationship: string,
    properties: Record<string, unknown> = {}
  ): number | null {
    const sourceNode = this.db
      .prepare("SELECT id FROM kg_nodes WHERE name = ?")
      .get(sourceName) as { id: number } | undefined;
    const targetNode = this.db
      .prepare("SELECT id FROM kg_nodes WHERE name = ?")
      .get(targetName) as { id: number } | undefined;

    if (!sourceNode || !targetNode) return null;

    const stmt = this.db.prepare(`
      INSERT INTO kg_edges (source_id, target_id, relationship, properties_json)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(source_id, target_id, relationship) DO UPDATE SET properties_json = excluded.properties_json
      RETURNING id
    `);
    const row = stmt.get(sourceNode.id, targetNode.id, relationship, JSON.stringify(properties)) as { id: number };
    return row.id;
  }

  addRelationships(
    rels: Array<{
      source: string;
      target: string;
      relationship: string;
      properties?: Record<string, unknown>;
    }>
  ): void {
    for (const r of rels) {
      this.addRelationship(r.source, r.target, r.relationship, r.properties ?? {});
    }
  }

  findRelated(query: string, depth = 2): KGNode[] {
    // Find seed nodes matching query
    const seeds = this.db
      .prepare("SELECT id, name, type, properties_json FROM kg_nodes WHERE name LIKE ? COLLATE NOCASE")
      .all(`%${query}%`) as Array<{ id: number; name: string; type: string; properties_json: string }>;

    const visited = new Set<number>();
    const result: KGNode[] = [];

    const traverse = (nodeIds: number[], currentDepth: number) => {
      if (currentDepth > depth || nodeIds.length === 0) return;

      const newIds: number[] = [];
      for (const nodeId of nodeIds) {
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = this.db
          .prepare("SELECT id, name, type, properties_json FROM kg_nodes WHERE id = ?")
          .get(nodeId) as { id: number; name: string; type: string; properties_json: string } | undefined;

        if (node) {
          result.push({
            id: node.id,
            name: node.name,
            type: node.type,
            properties: JSON.parse(node.properties_json) as Record<string, unknown>,
          });
        }

        // Get connected nodes
        const edges = this.db
          .prepare("SELECT target_id FROM kg_edges WHERE source_id = ? UNION SELECT source_id FROM kg_edges WHERE target_id = ?")
          .all(nodeId, nodeId) as Array<{ target_id: number }>;

        for (const edge of edges) {
          if (!visited.has(edge.target_id)) {
            newIds.push(edge.target_id);
          }
        }
      }

      traverse(newIds, currentDepth + 1);
    };

    traverse(
      seeds.map((s) => s.id),
      0
    );

    return result;
  }

  search(query: string): Array<{ node: KGNode; edges: KGEdge[] }> {
    const nodes = this.db
      .prepare("SELECT id, name, type, properties_json FROM kg_nodes WHERE name LIKE ? COLLATE NOCASE")
      .all(`%${query}%`) as Array<{ id: number; name: string; type: string; properties_json: string }>;

    return nodes.map((n) => {
      const edges = this.db
        .prepare(
          "SELECT id, source_id, target_id, relationship, properties_json FROM kg_edges WHERE source_id = ? OR target_id = ?"
        )
        .all(n.id, n.id) as Array<{
        id: number;
        source_id: number;
        target_id: number;
        relationship: string;
        properties_json: string;
      }>;

      return {
        node: {
          id: n.id,
          name: n.name,
          type: n.type,
          properties: JSON.parse(n.properties_json) as Record<string, unknown>,
        },
        edges: edges.map((e) => ({
          id: e.id,
          sourceId: e.source_id,
          targetId: e.target_id,
          relationship: e.relationship,
          properties: JSON.parse(e.properties_json) as Record<string, unknown>,
        })),
      };
    });
  }

  async ingestText(text: string, llmCall: LLMCallFn): Promise<void> {
    const extracted = await this.extractEntities(text, llmCall);
    this.addEntities(extracted.entities);
    this.addRelationships(extracted.relationships);
  }

  close(): void {
    this.db.close();
  }
}
