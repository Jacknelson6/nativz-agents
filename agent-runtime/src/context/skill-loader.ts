/**
 * Modular SKILL.md loader — loads skill files from agent directories,
 * parses frontmatter, and matches skills to messages.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface SkillFile {
  name: string;
  description: string;
  triggers: string[];
  toolsRequired: string[];
  content: string;
  filePath: string;
}

interface SkillFrontmatter {
  name?: string;
  description?: string;
  triggers?: string[];
  tools_required?: string[];
}

function parseFrontmatter(raw: string): { frontmatter: SkillFrontmatter; body: string } {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const fmBlock = match[1];
  const body = match[2];
  const frontmatter: SkillFrontmatter = {};

  for (const line of fmBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();

    if (key === "name") {
      frontmatter.name = value;
    } else if (key === "description") {
      frontmatter.description = value;
    } else if (key === "triggers") {
      frontmatter.triggers = parseYamlArray(value);
    } else if (key === "tools_required") {
      frontmatter.tools_required = parseYamlArray(value);
    }
  }

  return { frontmatter, body };
}

function parseYamlArray(value: string): string[] {
  // Handle inline array: [a, b, c]
  const inlineMatch = value.match(/^\[(.+)\]$/);
  if (inlineMatch) {
    return inlineMatch[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
  }
  // Single value
  if (value.length > 0) {
    return [value];
  }
  return [];
}

export class SkillLoader {
  private skills: SkillFile[] = [];

  async loadDirectory(dirPath: string): Promise<SkillFile[]> {
    const loaded: SkillFile[] = [];

    if (!fs.existsSync(dirPath)) return loaded;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(".skill.md") && entry.name !== "SKILL.md") continue;

      const filePath = path.join(dirPath, entry.name);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(raw);

      const skill: SkillFile = {
        name: frontmatter.name ?? path.basename(entry.name, ".skill.md"),
        description: frontmatter.description ?? "",
        triggers: frontmatter.triggers ?? [],
        toolsRequired: frontmatter.tools_required ?? [],
        content: body.trim(),
        filePath,
      };

      loaded.push(skill);
    }

    this.skills.push(...loaded);
    return loaded;
  }

  matchSkills(message: string): SkillFile[] {
    const lowerMessage = message.toLowerCase();
    const words = new Set(lowerMessage.split(/\s+/));

    return this.skills.filter((skill) => {
      if (skill.triggers.length === 0) return false;
      return skill.triggers.some((trigger) => {
        const triggerLower = trigger.toLowerCase();
        // Match if trigger is a substring of message or matches a word
        return lowerMessage.includes(triggerLower) || words.has(triggerLower);
      });
    });
  }

  injectSkills(message: string): string {
    const matched = this.matchSkills(message);
    if (matched.length === 0) return "";

    const sections = matched.map(
      (s) => `<skill name="${s.name}">\n${s.content}\n</skill>`
    );
    return sections.join("\n\n");
  }

  getAllSkills(): SkillFile[] {
    return [...this.skills];
  }

  clear(): void {
    this.skills = [];
  }
}
