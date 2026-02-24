/**
 * Eval tracker — records per-turn quality scores in SQLite.
 */

import Database from "better-sqlite3";
import type { QualityScore } from "./scorer.js";

export interface EvalRecord {
  id: number;
  conversationId: string;
  turnIndex: number;
  scores: QualityScore;
  agentId: string;
  model: string;
  createdAt: string;
}

export interface AgentAverage {
  agentId: string;
  avgRelevance: number;
  avgCompleteness: number;
  avgToolEfficiency: number;
  avgOverall: number;
  turnCount: number;
}

export interface ModelComparison {
  model: string;
  avgOverall: number;
  turnCount: number;
}

export class EvalTracker {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS eval_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        turn_index INTEGER NOT NULL,
        agent_id TEXT NOT NULL DEFAULT '',
        model TEXT NOT NULL DEFAULT '',
        scores_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  recordTurn(
    conversationId: string,
    turnIndex: number,
    scores: QualityScore,
    agentId = "",
    model = ""
  ): void {
    this.db
      .prepare(
        `INSERT INTO eval_scores (conversation_id, turn_index, agent_id, model, scores_json)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(conversationId, turnIndex, agentId, model, JSON.stringify(scores));
  }

  getConversationScores(conversationId: string): EvalRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, conversation_id, turn_index, agent_id, model, scores_json, created_at
         FROM eval_scores WHERE conversation_id = ? ORDER BY turn_index`
      )
      .all(conversationId) as Array<{
        id: number;
        conversation_id: string;
        turn_index: number;
        agent_id: string;
        model: string;
        scores_json: string;
        created_at: string;
      }>;

    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversation_id,
      turnIndex: r.turn_index,
      scores: JSON.parse(r.scores_json) as QualityScore,
      agentId: r.agent_id,
      model: r.model,
      createdAt: r.created_at,
    }));
  }

  getAgentAverages(): AgentAverage[] {
    const rows = this.db
      .prepare(
        `SELECT agent_id,
                AVG(json_extract(scores_json, '$.relevance')) as avg_relevance,
                AVG(json_extract(scores_json, '$.completeness')) as avg_completeness,
                AVG(json_extract(scores_json, '$.toolEfficiency')) as avg_tool_efficiency,
                AVG(json_extract(scores_json, '$.overall')) as avg_overall,
                COUNT(*) as turn_count
         FROM eval_scores
         WHERE agent_id != ''
         GROUP BY agent_id`
      )
      .all() as Array<{
        agent_id: string;
        avg_relevance: number;
        avg_completeness: number;
        avg_tool_efficiency: number;
        avg_overall: number;
        turn_count: number;
      }>;

    return rows.map((r) => ({
      agentId: r.agent_id,
      avgRelevance: r.avg_relevance,
      avgCompleteness: r.avg_completeness,
      avgToolEfficiency: r.avg_tool_efficiency,
      avgOverall: r.avg_overall,
      turnCount: r.turn_count,
    }));
  }

  getModelComparison(): ModelComparison[] {
    const rows = this.db
      .prepare(
        `SELECT model,
                AVG(json_extract(scores_json, '$.overall')) as avg_overall,
                COUNT(*) as turn_count
         FROM eval_scores
         WHERE model != ''
         GROUP BY model
         ORDER BY avg_overall DESC`
      )
      .all() as Array<{
        model: string;
        avg_overall: number;
        turn_count: number;
      }>;

    return rows.map((r) => ({
      model: r.model,
      avgOverall: r.avg_overall,
      turnCount: r.turn_count,
    }));
  }

  close(): void {
    this.db.close();
  }
}
