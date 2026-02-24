import { BrowserManager } from "./manager.js";
import type { Page } from "playwright";

/**
 * Simple page pool that reuses browser instances.
 * For now delegates to BrowserManager singleton.
 * Future: maintain a pool of warm pages for faster skill execution.
 */
export class BrowserPool {
  private manager = BrowserManager.getInstance();
  private pages: Page[] = [];

  async acquire(viewport?: { width: number; height: number }): Promise<Page> {
    const page = await this.manager.newPage(viewport);
    this.pages.push(page);
    return page;
  }

  async release(page: Page): Promise<void> {
    const idx = this.pages.indexOf(page);
    if (idx >= 0) this.pages.splice(idx, 1);
    await page.close().catch(() => {});
  }

  async closeAll(): Promise<void> {
    await Promise.all(this.pages.map((p) => p.close().catch(() => {})));
    this.pages = [];
    await this.manager.close();
  }
}
