import type { Browser, BrowserContext, Page } from "playwright";

let browserModule: typeof import("playwright") | null = null;

async function getPlaywright() {
  if (!browserModule) {
    browserModule = await import("playwright");
  }
  return browserModule;
}

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  async ensureBrowser(): Promise<Browser> {
    if (!this.browser) {
      const pw = await getPlaywright();
      this.browser = await pw.chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async newPage(viewport?: { width: number; height: number }): Promise<Page> {
    const browser = await this.ensureBrowser();
    if (!this.context) {
      this.context = await browser.newContext({
        viewport: viewport ?? { width: 1280, height: 720 },
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      });
    }
    return this.context.newPage();
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
