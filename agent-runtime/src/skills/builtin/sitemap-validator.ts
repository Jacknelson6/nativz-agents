import { z } from "zod";
import type { SkillDefinition } from "../registry.js";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

interface SitemapIssue {
  severity: "error" | "warning" | "info";
  message: string;
  url?: string;
}

function parseSitemapXml(xml: string): { urls: SitemapUrl[]; sitemapIndexUrls: string[]; parseErrors: string[] } {
  const urls: SitemapUrl[] = [];
  const sitemapIndexUrls: string[] = [];
  const parseErrors: string[] = [];

  // Check if this is a sitemap index
  const isSitemapIndex = /<sitemapindex/i.test(xml);

  if (isSitemapIndex) {
    const sitemapMatches = [...xml.matchAll(/<sitemap>([\s\S]*?)<\/sitemap>/gi)];
    for (const match of sitemapMatches) {
      const locMatch = match[1].match(/<loc>([\s\S]*?)<\/loc>/i);
      if (locMatch) {
        sitemapIndexUrls.push(locMatch[1].trim());
      }
    }
    return { urls, sitemapIndexUrls, parseErrors };
  }

  // Parse regular sitemap
  const urlMatches = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)];

  for (const match of urlMatches) {
    const locMatch = match[1].match(/<loc>([\s\S]*?)<\/loc>/i);
    if (!locMatch) {
      parseErrors.push("Found <url> block without <loc> element.");
      continue;
    }
    const loc = locMatch[1].trim();
    const lastmodMatch = match[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/i);
    const changefreqMatch = match[1].match(/<changefreq>([\s\S]*?)<\/changefreq>/i);
    const priorityMatch = match[1].match(/<priority>([\s\S]*?)<\/priority>/i);

    urls.push({
      loc,
      lastmod: lastmodMatch?.[1]?.trim(),
      changefreq: changefreqMatch?.[1]?.trim(),
      priority: priorityMatch?.[1]?.trim(),
    });
  }

  return { urls, sitemapIndexUrls, parseErrors };
}

function validateUrls(urls: SitemapUrl[]): SitemapIssue[] {
  const issues: SitemapIssue[] = [];
  const validChangefreqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
  const seenLocs = new Set<string>();

  for (const entry of urls) {
    // Validate URL format
    try {
      new URL(entry.loc);
    } catch {
      issues.push({
        severity: "error",
        message: `Invalid URL format: ${entry.loc}`,
        url: entry.loc,
      });
    }

    // Check for duplicates
    if (seenLocs.has(entry.loc)) {
      issues.push({
        severity: "warning",
        message: `Duplicate URL: ${entry.loc}`,
        url: entry.loc,
      });
    }
    seenLocs.add(entry.loc);

    // Validate lastmod format
    if (entry.lastmod) {
      const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}([+-]\d{2}:\d{2}|Z)?)?$/;
      if (!datePattern.test(entry.lastmod)) {
        issues.push({
          severity: "warning",
          message: `Invalid lastmod date format "${entry.lastmod}". Use W3C Datetime (YYYY-MM-DD or ISO 8601).`,
          url: entry.loc,
        });
      }
    }

    // Validate changefreq
    if (entry.changefreq && !validChangefreqs.includes(entry.changefreq.toLowerCase())) {
      issues.push({
        severity: "warning",
        message: `Invalid changefreq "${entry.changefreq}". Valid values: ${validChangefreqs.join(", ")}.`,
        url: entry.loc,
      });
    }

    // Validate priority
    if (entry.priority) {
      const pval = parseFloat(entry.priority);
      if (isNaN(pval) || pval < 0 || pval > 1) {
        issues.push({
          severity: "warning",
          message: `Invalid priority "${entry.priority}". Must be between 0.0 and 1.0.`,
          url: entry.loc,
        });
      }
    }
  }

  return issues;
}

function checkFreshness(urls: SitemapUrl[]): SitemapIssue[] {
  const issues: SitemapIssue[] = [];
  const now = Date.now();
  const sixMonthsMs = 180 * 24 * 60 * 60 * 1000;
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  let urlsWithLastmod = 0;
  let staleCount = 0;
  let veryStaleCount = 0;

  for (const entry of urls) {
    if (entry.lastmod) {
      urlsWithLastmod++;
      const date = new Date(entry.lastmod).getTime();
      if (!isNaN(date)) {
        const age = now - date;
        if (age > oneYearMs) {
          veryStaleCount++;
        } else if (age > sixMonthsMs) {
          staleCount++;
        }
      }
    }
  }

  if (urls.length > 0 && urlsWithLastmod === 0) {
    issues.push({
      severity: "warning",
      message: "No URLs have lastmod dates. Adding lastmod helps search engines prioritize crawling.",
    });
  } else if (urls.length > 0 && urlsWithLastmod < urls.length * 0.5) {
    issues.push({
      severity: "info",
      message: `Only ${urlsWithLastmod}/${urls.length} URLs have lastmod dates. Consider adding lastmod to all URLs.`,
    });
  }

  if (veryStaleCount > 0) {
    issues.push({
      severity: "warning",
      message: `${veryStaleCount} URL(s) have lastmod dates older than 1 year. Update or verify these are still current.`,
    });
  }

  if (staleCount > 0) {
    issues.push({
      severity: "info",
      message: `${staleCount} URL(s) have lastmod dates older than 6 months.`,
    });
  }

  return issues;
}

async function checkSampleUrls(urls: SitemapUrl[], sampleSize: number): Promise<{ checked: number; results: Array<{ url: string; status: number | string }> }> {
  const sample = urls
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize);

  const results: Array<{ url: string; status: number | string }> = [];

  for (const entry of sample) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(entry.loc, {
        method: "HEAD",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NativzSEO/1.0; +https://nativz.com)",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeoutId);
      results.push({ url: entry.loc, status: response.status });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        results.push({ url: entry.loc, status: "timeout" });
      } else {
        results.push({ url: entry.loc, status: `error: ${(err as Error).message}` });
      }
    }
  }

  return { checked: sample.length, results };
}

export const sitemapValidatorSkill: SkillDefinition = {
  name: "sitemap-validator",
  description:
    "Validate an XML sitemap by fetching and parsing it. Checks URL count, format validity, lastmod freshness, duplicate URLs, and tests sample URL response codes.",
  group: "seo",
  parameters: z.object({
    url: z.string().url().describe("URL of the XML sitemap to validate"),
  }),
  execute: async (params) => {
    const { url } = params as { url: string };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NativzSEO/1.0; +https://nativz.com)",
          Accept: "application/xml, text/xml",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return JSON.stringify({
          error: `Failed to fetch sitemap: HTTP ${response.status} ${response.statusText}`,
          url,
          valid: false,
        });
      }

      const contentType = response.headers.get("content-type") ?? "";
      const xml = await response.text();

      // Basic XML check
      const issues: SitemapIssue[] = [];

      if (!contentType.includes("xml") && !contentType.includes("text/plain")) {
        issues.push({
          severity: "warning",
          message: `Sitemap content-type is "${contentType}". Expected application/xml or text/xml.`,
        });
      }

      if (!xml.trim().startsWith("<?xml") && !xml.trim().startsWith("<urlset") && !xml.trim().startsWith("<sitemapindex")) {
        issues.push({
          severity: "error",
          message: "Response does not appear to be valid XML. Missing XML declaration or root element.",
        });
        return JSON.stringify({
          url,
          valid: false,
          issues,
          urlCount: 0,
        });
      }

      const { urls, sitemapIndexUrls, parseErrors } = parseSitemapXml(xml);

      for (const pe of parseErrors) {
        issues.push({ severity: "error", message: pe });
      }

      // Sitemap index handling
      if (sitemapIndexUrls.length > 0) {
        return JSON.stringify({
          url,
          valid: true,
          type: "sitemapindex",
          childSitemapCount: sitemapIndexUrls.length,
          childSitemaps: sitemapIndexUrls.slice(0, 50),
          issues,
          notes: [
            "This is a sitemap index file. Run this tool on individual child sitemaps for detailed validation.",
          ],
        });
      }

      // URL count limits
      if (urls.length > 50000) {
        issues.push({
          severity: "error",
          message: `Sitemap contains ${urls.length} URLs. The maximum allowed by the protocol is 50,000.`,
        });
      }

      if (urls.length === 0) {
        issues.push({
          severity: "error",
          message: "Sitemap contains no URLs.",
        });
      }

      // File size check
      const sizeBytes = new TextEncoder().encode(xml).length;
      const sizeMb = sizeBytes / (1024 * 1024);
      if (sizeMb > 50) {
        issues.push({
          severity: "error",
          message: `Sitemap is ${sizeMb.toFixed(1)}MB. Maximum allowed is 50MB (uncompressed).`,
        });
      }

      // Validate URL entries
      issues.push(...validateUrls(urls));

      // Check freshness
      issues.push(...checkFreshness(urls));

      // Check HTTP protocol consistency
      const urlObj = new URL(url);
      const httpsCount = urls.filter((u) => u.loc.startsWith("https://")).length;
      const httpCount = urls.filter((u) => u.loc.startsWith("http://") && !u.loc.startsWith("https://")).length;
      if (urlObj.protocol === "https:" && httpCount > 0) {
        issues.push({
          severity: "warning",
          message: `Sitemap is served over HTTPS but contains ${httpCount} HTTP URL(s). Use consistent protocol.`,
        });
      }
      if (httpCount > 0 && httpsCount > 0) {
        issues.push({
          severity: "warning",
          message: `Mixed protocols: ${httpsCount} HTTPS and ${httpCount} HTTP URLs.`,
        });
      }

      // Sample URL check (up to 5)
      const sampleResults = urls.length > 0
        ? await checkSampleUrls(urls, Math.min(5, urls.length))
        : { checked: 0, results: [] };

      const brokenSamples = sampleResults.results.filter(
        (r) => typeof r.status === "number" && (r.status >= 400 || r.status === 0)
      );
      for (const broken of brokenSamples) {
        issues.push({
          severity: "error",
          message: `Sample URL returned HTTP ${broken.status}: ${broken.url}`,
          url: broken.url,
        });
      }

      const errorCount = issues.filter((i) => i.severity === "error").length;
      const warningCount = issues.filter((i) => i.severity === "warning").length;

      return JSON.stringify({
        url,
        valid: errorCount === 0,
        type: "urlset",
        urlCount: urls.length,
        fileSizeMb: Math.round(sizeMb * 100) / 100,
        summary: {
          errors: errorCount,
          warnings: warningCount,
          urlsWithLastmod: urls.filter((u) => u.lastmod).length,
          urlsWithChangefreq: urls.filter((u) => u.changefreq).length,
          urlsWithPriority: urls.filter((u) => u.priority).length,
        },
        sampleUrlCheck: sampleResults,
        issues,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return JSON.stringify({
          error: "Sitemap fetch timed out after 30 seconds",
          url,
          valid: false,
        });
      }
      return JSON.stringify({
        error: `Sitemap validation failed: ${(err as Error).message}`,
        url,
        valid: false,
      });
    }
  },
};
