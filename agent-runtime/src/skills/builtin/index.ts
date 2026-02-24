import { fileReadSkill } from "./file-read.js";
import { fileWriteSkill } from "./file-write.js";
import { httpRequestSkill } from "./http-request.js";
import { webSearchSkill } from "./web-search.js";
import { screenshotSkill } from "./screenshot.js";
import { webCrawlSkill } from "./web-crawl.js";
import type { SkillDefinition } from "../registry.js";

export const builtinSkills: SkillDefinition[] = [
  fileReadSkill,
  fileWriteSkill,
  httpRequestSkill,
  webSearchSkill,
  screenshotSkill,
  webCrawlSkill,
];
