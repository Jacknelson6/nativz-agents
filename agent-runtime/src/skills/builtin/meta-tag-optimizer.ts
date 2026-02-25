import { z } from "zod";
import type { SkillDefinition } from "../registry.js";

interface MetaTagSet {
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  canonical: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  viewport: string;
  charset: string;
  hreflang: string[];
}

interface TagScore {
  tag: string;
  score: number;
  maxScore: number;
  issues: string[];
  suggestion?: string;
}

function extractMetaTags(html: string, url: string): MetaTagSet {
  const getTag = (pattern: RegExp): string => {
    const match = html.match(pattern);
    return match?.[1]?.trim() ?? "";
  };

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "";

  const metaDescription = getTag(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  ) || getTag(
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i
  );

  const canonical = getTag(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i
  ) || getTag(
    /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i
  );

  const robots = getTag(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i
  ) || getTag(
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i
  );

  const ogTitle = getTag(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i
  );
  const ogDescription = getTag(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i
  );
  const ogImage = getTag(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i
  );
  const ogType = getTag(
    /<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']*)["']/i
  );
  const ogUrl = getTag(
    /<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i
  );

  const twitterCard = getTag(
    /<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i
  );
  const twitterTitle = getTag(
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)["']/i
  );
  const twitterDescription = getTag(
    /<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']*)["']/i
  );
  const twitterImage = getTag(
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']*)["']/i
  );

  const viewport = getTag(
    /<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i
  );

  const charsetMatch = html.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i);
  const charset = charsetMatch?.[1] ?? "";

  const hreflangMatches = [
    ...html.matchAll(
      /<link[^>]+hreflang=["']([^"']*)["'][^>]+href=["']([^"']*)["']/gi
    ),
  ];
  const hreflang = hreflangMatches.map(
    (m) => `${m[1]}: ${m[2]}`
  );

  return {
    title,
    titleLength: title.length,
    metaDescription,
    metaDescriptionLength: metaDescription.length,
    canonical,
    robots,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    ogUrl,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    viewport,
    charset,
    hreflang,
  };
}

function scoreTags(tags: MetaTagSet, url: string, targetKeyword?: string): TagScore[] {
  const scores: TagScore[] = [];

  // Title tag
  const titleIssues: string[] = [];
  let titleScore = 0;
  const titleMax = 25;
  if (tags.title) {
    titleScore += 5;
    if (tags.titleLength >= 30 && tags.titleLength <= 60) {
      titleScore += 10;
    } else if (tags.titleLength < 30) {
      titleIssues.push(`Title too short (${tags.titleLength} chars). Aim for 30-60 characters.`);
      titleScore += 3;
    } else {
      titleIssues.push(`Title too long (${tags.titleLength} chars). Will be truncated in SERPs. Aim for 30-60 characters.`);
      titleScore += 3;
    }
    if (targetKeyword && tags.title.toLowerCase().includes(targetKeyword.toLowerCase())) {
      titleScore += 10;
    } else if (targetKeyword) {
      titleIssues.push(`Target keyword "${targetKeyword}" not found in title.`);
    } else {
      titleScore += 5; // No keyword check requested
    }
  } else {
    titleIssues.push("Missing title tag. This is critical for SEO.");
  }
  scores.push({ tag: "title", score: titleScore, maxScore: titleMax, issues: titleIssues });

  // Meta description
  const descIssues: string[] = [];
  let descScore = 0;
  const descMax = 25;
  if (tags.metaDescription) {
    descScore += 5;
    if (tags.metaDescriptionLength >= 120 && tags.metaDescriptionLength <= 160) {
      descScore += 10;
    } else if (tags.metaDescriptionLength < 120) {
      descIssues.push(`Meta description too short (${tags.metaDescriptionLength} chars). Aim for 120-160 characters.`);
      descScore += 3;
    } else {
      descIssues.push(`Meta description too long (${tags.metaDescriptionLength} chars). Will be truncated. Aim for 120-160 characters.`);
      descScore += 3;
    }
    if (targetKeyword && tags.metaDescription.toLowerCase().includes(targetKeyword.toLowerCase())) {
      descScore += 10;
    } else if (targetKeyword) {
      descIssues.push(`Target keyword "${targetKeyword}" not found in meta description.`);
    } else {
      descScore += 5;
    }
  } else {
    descIssues.push("Missing meta description. Search engines may auto-generate one, but it's better to control it.");
  }
  scores.push({ tag: "meta-description", score: descScore, maxScore: descMax, issues: descIssues });

  // Canonical
  const canonicalIssues: string[] = [];
  let canonicalScore = 0;
  const canonicalMax = 10;
  if (tags.canonical) {
    canonicalScore += 5;
    try {
      const canonicalUrl = new URL(tags.canonical, url);
      const pageUrl = new URL(url);
      if (canonicalUrl.origin === pageUrl.origin) {
        canonicalScore += 5;
      } else {
        canonicalIssues.push("Canonical points to a different domain. Verify this is intentional.");
      }
    } catch {
      canonicalIssues.push("Canonical URL is malformed.");
    }
  } else {
    canonicalIssues.push("No canonical tag. Add one to prevent duplicate content issues.");
  }
  scores.push({ tag: "canonical", score: canonicalScore, maxScore: canonicalMax, issues: canonicalIssues });

  // Robots
  const robotsIssues: string[] = [];
  let robotsScore = 0;
  const robotsMax = 10;
  if (tags.robots) {
    robotsScore += 5;
    if (tags.robots.toLowerCase().includes("noindex")) {
      robotsIssues.push("Page is set to noindex. It will not appear in search results.");
    } else {
      robotsScore += 5;
    }
    if (tags.robots.toLowerCase().includes("nofollow")) {
      robotsIssues.push("Page is set to nofollow. Links on this page will not pass authority.");
    }
  } else {
    robotsScore += 10; // No robots meta means default index,follow which is fine
  }
  scores.push({ tag: "robots", score: robotsScore, maxScore: robotsMax, issues: robotsIssues });

  // Open Graph
  const ogIssues: string[] = [];
  let ogScore = 0;
  const ogMax = 20;
  if (tags.ogTitle) ogScore += 5; else ogIssues.push("Missing og:title.");
  if (tags.ogDescription) ogScore += 5; else ogIssues.push("Missing og:description.");
  if (tags.ogImage) ogScore += 5; else ogIssues.push("Missing og:image. Social shares will lack a preview image.");
  if (tags.ogUrl) ogScore += 3; else ogIssues.push("Missing og:url.");
  if (tags.ogType) ogScore += 2; else ogIssues.push("Missing og:type.");
  scores.push({ tag: "open-graph", score: ogScore, maxScore: ogMax, issues: ogIssues });

  // Twitter Card
  const twIssues: string[] = [];
  let twScore = 0;
  const twMax = 10;
  if (tags.twitterCard) twScore += 4; else twIssues.push("Missing twitter:card. Add 'summary_large_image' for rich previews.");
  if (tags.twitterTitle || tags.ogTitle) twScore += 3; else twIssues.push("Missing twitter:title (and no og:title fallback).");
  if (tags.twitterImage || tags.ogImage) twScore += 3; else twIssues.push("Missing twitter:image (and no og:image fallback).");
  scores.push({ tag: "twitter-card", score: twScore, maxScore: twMax, issues: twIssues });

  return scores;
}

function generateSuggestions(
  tags: MetaTagSet,
  url: string,
  targetKeyword?: string
): Record<string, string> {
  const suggestions: Record<string, string> = {};

  if (!tags.title || tags.titleLength < 30 || tags.titleLength > 60) {
    const base = tags.title || "[Primary Keyword] - [Brand Name]";
    const kw = targetKeyword ? `${targetKeyword} - ` : "";
    suggestions.title = tags.title
      ? tags.title.slice(0, 55)
      : `${kw}${base}`.slice(0, 60);
  }

  if (!tags.metaDescription || tags.metaDescriptionLength < 120 || tags.metaDescriptionLength > 160) {
    const kw = targetKeyword ? `Learn about ${targetKeyword}. ` : "";
    suggestions.metaDescription = tags.metaDescription
      ? tags.metaDescription.slice(0, 155) + "..."
      : `${kw}[Compelling description of the page content with a clear call to action.]`.slice(0, 160);
  }

  if (!tags.canonical) {
    suggestions.canonical = url.split("?")[0];
  }

  if (!tags.ogTitle) {
    suggestions.ogTitle = tags.title || "[Page Title for Social]";
  }

  if (!tags.ogDescription) {
    suggestions.ogDescription =
      tags.metaDescription || "[Social media description - can be more engaging than meta description]";
  }

  if (!tags.ogImage) {
    suggestions.ogImage = "[URL to 1200x630 image for social sharing]";
  }

  if (!tags.twitterCard) {
    suggestions.twitterCard = "summary_large_image";
  }

  return suggestions;
}

export const metaTagOptimizerSkill: SkillDefinition = {
  name: "meta-tag-optimizer",
  description:
    "Analyze and optimize a page's meta tags for SEO. Extracts current title, description, OG tags, canonical, robots, and scores them with optimization suggestions.",
  group: "seo",
  parameters: z.object({
    url: z.string().url().describe("URL of the page to analyze"),
    targetKeyword: z
      .string()
      .optional()
      .describe("Target keyword to check for in tags"),
  }),
  execute: async (params) => {
    const { url, targetKeyword } = params as {
      url: string;
      targetKeyword?: string;
    };
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; NativzSEO/1.0; +https://nativz.com)",
          Accept: "text/html",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return JSON.stringify({
          error: `Failed to fetch page: HTTP ${response.status} ${response.statusText}`,
        });
      }

      const html = await response.text();
      const tags = extractMetaTags(html, url);
      const tagScores = scoreTags(tags, url, targetKeyword);
      const totalScore = tagScores.reduce((sum, s) => sum + s.score, 0);
      const maxTotalScore = tagScores.reduce((sum, s) => sum + s.maxScore, 0);
      const suggestions = generateSuggestions(tags, url, targetKeyword);
      const allIssues = tagScores.flatMap((s) => s.issues).filter(Boolean);

      return JSON.stringify({
        url,
        targetKeyword: targetKeyword ?? null,
        overallScore: {
          score: totalScore,
          maxScore: maxTotalScore,
          percentage: Math.round((totalScore / maxTotalScore) * 100),
          grade:
            totalScore / maxTotalScore >= 0.9
              ? "A"
              : totalScore / maxTotalScore >= 0.7
              ? "B"
              : totalScore / maxTotalScore >= 0.5
              ? "C"
              : totalScore / maxTotalScore >= 0.3
              ? "D"
              : "F",
        },
        currentTags: tags,
        scores: tagScores,
        issues: allIssues,
        suggestions,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return JSON.stringify({
          error: "Page fetch timed out after 30 seconds",
        });
      }
      return JSON.stringify({
        error: `Meta tag analysis failed: ${(err as Error).message}`,
      });
    }
  },
};
