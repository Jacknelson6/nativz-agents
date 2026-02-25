import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { BrowserManager } from "../../browser/manager.js";

export const browserInteractSkill: SkillDefinition = {
  name: "browser-interact",
  description:
    "Interact with a webpage using a headless browser. Navigate to a URL, then perform actions like clicking elements, filling form fields, or selecting options using CSS selectors.",
  parameters: z.object({
    url: z.string().url().describe("URL to navigate to before performing the action"),
    actions: z
      .array(
        z.object({
          type: z
            .enum(["click", "fill", "select", "check", "uncheck", "press"])
            .describe("Action type"),
          selector: z.string().describe("CSS selector for the target element"),
          value: z
            .string()
            .optional()
            .describe("Value for fill/select/press actions (text, option value, or key name)"),
        })
      )
      .describe("Ordered list of actions to perform on the page"),
  }),
  execute: async (params) => {
    const { url, actions } = params as {
      url: string;
      actions: Array<{ type: string; selector: string; value?: string }>;
    };
    const manager = BrowserManager.getInstance();
    const page = await manager.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const results: Array<{ action: string; selector: string; success: boolean; error?: string }> = [];

      for (const action of actions) {
        try {
          await page.waitForSelector(action.selector, { timeout: 5000 });
          switch (action.type) {
            case "click":
              await page.click(action.selector);
              break;
            case "fill":
              await page.fill(action.selector, action.value ?? "");
              break;
            case "select":
              await page.selectOption(action.selector, action.value ?? "");
              break;
            case "check":
              await page.check(action.selector);
              break;
            case "uncheck":
              await page.uncheck(action.selector);
              break;
            case "press":
              await page.press(action.selector, action.value ?? "Enter");
              break;
          }
          results.push({ action: action.type, selector: action.selector, success: true });
        } catch (err) {
          results.push({
            action: action.type,
            selector: action.selector,
            success: false,
            error: (err as Error).message,
          });
        }
      }

      // Capture final page state
      const finalUrl = page.url();
      const finalTitle = await page.title();

      return JSON.stringify({ success: true, url: finalUrl, title: finalTitle, results });
    } catch (err) {
      return JSON.stringify({ success: false, error: (err as Error).message });
    } finally {
      await page.close();
    }
  },
};
