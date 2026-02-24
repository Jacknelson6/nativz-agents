/**
 * Entity Relationship Memory — tracks and traverses entity relationships from conversations.
 */

import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";

export interface Entity {
  id: number;
  name: string;
  type: string;
  firstSeen: string;
  lastSeen: string;
  mentionCount: number;
}

export interface Relationship {
  id: number;
  sourceId: number;
  targetId: number;
  relationType: string;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
}

export interface EntityWithRelations {
  entity: Entity;
  relationships: Array<{
    relation: Relationship;
    connectedEntity: Entity;
    direction: "outgoing" | "incoming";
  }>;
}

interface EntityRow {
  id: number;
  name: string;
  type: string;
  first_seen: string;
  last_seen: string;
  mention_count: number;
}

interface RelationshipRow {
  id: number;
  source_id: number;
  target_id: number;
  relation_type: string;
  confidence: number;
  first_seen: string;
  last_seen: string;
}

interface JoinedRelRow extends RelationshipRow {
  entity_id: number;
  entity_name: string;
  entity_type: string;
  entity_first_seen: string;
  entity_last_seen: string;
  entity_mention_count: number;
  direction: string;
}

type LLMCallFn = (prompt: string) => Promise<string>;

const EXTRACT_PROMPT = `Extract entity relationships from this conversation excerpt.

Return ONLY valid JSON:
{
  "entities": [{"name": "string", "type": "person|organization|brand|project|concept|location"}],
  "relationships": [{"source": "entity name", "target": "entity name", "relation": "works_with|manages|owns|uses|part_of|related_to|reports_to|competes_with|located_in|created_by", "confidence": 0.0-1.0}]
}

Only extract clearly stated relationships. Be conservative.

Text:
`;

function rowToEntity(row: EntityRow): Entity {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
    mentionCount: row.mention_count,
  };
}

function rowToRelationship(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    sourceId: row.source_id,
    targetId: row.target_id,
    relationType: row.relation_type,
    confidence: row.confidence,
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
  };
}

export class EntityGraph {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const resolved = dbPath ?? path.join(process.cwd(), "data", "entity_graph.db");
    fs.mkdirSync(path.dirname(resolved), { recursive: true });
    this.db = new Database(resolved);
    this.db.pragma("journal_mode = WAL");
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS eg_entities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        type TEXT NOT NULL,
        first_seen TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen TEXT NOT NULL DEFAULT (datetime('now')),
        mention_count INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX IF NOT EXISTS idx_eg_name ON eg_entities(name COLLATE NOCASE);
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS eg_relationships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL REFERENCES eg_entities(id),
        target_id INTEGER NOT NULL REFERENCES eg_entities(id),
        relation_type TEXT NOT NULL,
        confidence REAL NOT NULL DEFAULT 0.8,
        first_seen TEXT NOT NULL DEFAULT (datetime('now')),
        last_seen TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(source_id, target_id, relation_type)
      );
      CREATE INDEX IF NOT EXISTS idx_eg_rel_source ON eg_relationships(source_id);
      CREATE INDEX IF NOT EXISTS idx_eg_rel_target ON eg_relationships(target_id);
    `);
  }

  upsertEntity(name: string, type: string): number {
    const existing = this.db.prepare(
      "SELECT id FROM eg_entities WHERE name = ? COLLATE NOCASE"
    ).get(name) as { id: number } | undefined;

    if (existing) {
      this.db.prepare(
        "UPDATE eg_entities SET last_seen = datetime('now'), mention_count = mention_count + 1 WHERE id = ?"
      ).run(existing.id);
      return existing.id;
    }

    const result = this.db.prepare(
      "INSERT INTO eg_entities (name, type) VALUES (?, ?)"
    ).run(name, type);
    return Number(result.lastInsertRowid);
  }

  addRelationship(sourceId: number, targetId: number, relationType: string, confidence = 0.8): void {
    this.db.prepare(`
      INSERT INTO eg_relationships (source_id, target_id, relation_type, confidence)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(source_id, target_id, relation_type) DO UPDATE SET
        confidence = MAX(confidence, excluded.confidence),
        last_seen = datetime('now')
    `).run(sourceId, targetId, relationType, confidence);
  }

  getEntity(name: string): Entity | null {
    const row = this.db.prepare(
      "SELECT * FROM eg_entities WHERE name = ? COLLATE NOCASE"
    ).get(name) as EntityRow | undefined;
    return row ? rowToEntity(row) : null;
  }

  getEntityWithRelations(name: string): EntityWithRelations | null {
    const entity = this.getEntity(name);
    if (!entity) return null;

    const rows = this.db.prepare(`
      SELECT r.*, 
        e.id as entity_id, e.name as entity_name, e.type as entity_type,
        e.first_seen as entity_first_seen, e.last_seen as entity_last_seen,
        e.mention_count as entity_mention_count,
        CASE WHEN r.source_id = ? THEN 'outgoing' ELSE 'incoming' END as direction
      FROM eg_relationships r
      JOIN eg_entities e ON (
        CASE WHEN r.source_id = ? THEN r.target_id ELSE r.source_id END = e.id
      )
      WHERE r.source_id = ? OR r.target_id = ?
      ORDER BY r.confidence DESC
    `).all(entity.id, entity.id, entity.id, entity.id) as JoinedRelRow[];

    return {
      entity,
      relationships: rows.map((row) => ({
        relation: rowToRelationship(row),
        connectedEntity: {
          id: row.entity_id,
          name: row.entity_name,
          type: row.entity_type,
          firstSeen: row.entity_first_seen,
          lastSeen: row.entity_last_seen,
          mentionCount: row.entity_mention_count,
        },
        direction: row.direction as "outgoing" | "incoming",
      })),
    };
  }

  /**
   * Traverse the graph from a starting entity up to a given depth.
   */
  traverse(name: string, maxDepth = 2): EntityWithRelations[] {
    const visited = new Set<string>();
    const results: EntityWithRelations[] = [];
    const queue: Array<{ entityName: string; depth: number }> = [{ entityName: name, depth: 0 }];

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      if (item.depth > maxDepth) continue;

      const key = item.entityName.toLowerCase();
      if (visited.has(key)) continue;
      visited.add(key);

      const entityData = this.getEntityWithRelations(item.entityName);
      if (!entityData) continue;

      results.push(entityData);

      if (item.depth < maxDepth) {
        for (const rel of entityData.relationships) {
          const connName = rel.connectedEntity.name.toLowerCase();
          if (!visited.has(connName)) {
            queue.push({ entityName: rel.connectedEntity.name, depth: item.depth + 1 });
          }
        }
      }
    }

    return results;
  }

  async extractAndStore(text: string, llmCall: LLMCallFn): Promise<void> {
    const raw = await llmCall(EXTRACT_PROMPT + text);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return;

    const parsed = JSON.parse(match[0]) as {
      entities: Array<{ name: string; type: string }>;
      relationships: Array<{ source: string; target: string; relation: string; confidence?: number }>;
    };

    const entityIds = new Map<string, number>();
    for (const e of parsed.entities) {
      const id = this.upsertEntity(e.name, e.type);
      entityIds.set(e.name.toLowerCase(), id);
    }

    for (const r of parsed.relationships) {
      const sourceId = entityIds.get(r.source.toLowerCase());
      const targetId = entityIds.get(r.target.toLowerCase());
      if (sourceId !== undefined && targetId !== undefined) {
        this.addRelationship(sourceId, targetId, r.relation, r.confidence ?? 0.8);
      }
    }
  }

  getAllEntities(): Entity[] {
    const rows = this.db.prepare("SELECT * FROM eg_entities ORDER BY mention_count DESC").all() as EntityRow[];
    return rows.map(rowToEntity);
  }

  close(): void {
    this.db.close();
  }
}
