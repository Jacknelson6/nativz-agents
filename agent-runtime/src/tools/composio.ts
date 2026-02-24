const COMPOSIO_BASE_URL = "https://backend.composio.dev/api/v1";

export type ComposioCategory = "social-media" | "analytics" | "crm" | "email" | "calendar";

export interface ComposioAction {
  name: string;
  display_name: string;
  description: string;
  app_name: string;
  parameters: Record<string, unknown>;
}

export interface ComposioAuthStatus {
  integration: string;
  authenticated: boolean;
  connectedAccountId: string | null;
}

export interface ComposioActionResult {
  success: boolean;
  data: Record<string, unknown>;
  error: string | null;
}

interface RateLimitState {
  remaining: number;
  resetAt: number;
}

const CATEGORY_APPS: Record<ComposioCategory, string[]> = {
  "social-media": ["twitter", "instagram", "linkedin", "facebook", "tiktok"],
  analytics: ["google_analytics", "mixpanel", "amplitude"],
  crm: ["hubspot", "salesforce", "pipedrive"],
  email: ["gmail", "outlook", "sendgrid"],
  calendar: ["google_calendar", "outlook_calendar"],
};

export class ComposioClient {
  private apiKey: string;
  private rateLimit: RateLimitState = { remaining: 100, resetAt: 0 };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async listActions(category?: ComposioCategory): Promise<ComposioAction[]> {
    await this.checkRateLimit();

    const params = new URLSearchParams();
    if (category) {
      const apps = CATEGORY_APPS[category];
      if (apps) {
        params.set("apps", apps.join(","));
      }
    }

    const url = `${COMPOSIO_BASE_URL}/actions${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await this.request(url);
    const data = (await response.json()) as { items?: ComposioAction[] };
    return data.items ?? [];
  }

  async executeAction(
    actionId: string,
    params: Record<string, unknown>,
    connectedAccountId?: string
  ): Promise<ComposioActionResult> {
    await this.checkRateLimit();

    const url = `${COMPOSIO_BASE_URL}/actions/${encodeURIComponent(actionId)}/execute`;
    const body: Record<string, unknown> = { input: params };
    if (connectedAccountId) {
      body.connectedAccountId = connectedAccountId;
    }

    const response = await this.request(url, {
      method: "POST",
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as Record<string, unknown>;
    return {
      success: response.ok,
      data: result,
      error: response.ok ? null : String(result["message"] ?? "Unknown error"),
    };
  }

  async getAuthStatus(integration: string): Promise<ComposioAuthStatus> {
    await this.checkRateLimit();

    const url = `${COMPOSIO_BASE_URL}/connectedAccounts?integrationId=${encodeURIComponent(integration)}`;
    const response = await this.request(url);
    const data = (await response.json()) as {
      items?: Array<{ id: string; status: string }>;
    };

    const account = data.items?.[0];
    return {
      integration,
      authenticated: account?.status === "active",
      connectedAccountId: account?.id ?? null,
    };
  }

  getCategories(): ComposioCategory[] {
    return Object.keys(CATEGORY_APPS) as ComposioCategory[];
  }

  getAppsForCategory(category: ComposioCategory): string[] {
    return [...(CATEGORY_APPS[category] ?? [])];
  }

  private async request(url: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");
    if (remaining !== null) this.rateLimit.remaining = parseInt(remaining, 10);
    if (reset !== null) this.rateLimit.resetAt = parseInt(reset, 10) * 1000;

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return this.request(url, init);
    }

    return response;
  }

  private async checkRateLimit(): Promise<void> {
    if (this.rateLimit.remaining <= 1 && Date.now() < this.rateLimit.resetAt) {
      const waitMs = this.rateLimit.resetAt - Date.now();
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
}
