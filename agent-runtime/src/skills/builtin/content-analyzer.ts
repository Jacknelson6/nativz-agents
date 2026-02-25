import { z } from "zod";
import type { SkillDefinition } from "../registry.js";
import { BrowserManager } from "../../browser/manager.js";

interface ContentAnalysis {
  url: string;
  title: string;
  metaDescription: string;
  wordCount: number;
  headingStructure: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
    totalHeadings: number;
    hasMultipleH1s: boolean;
    missingH1: boolean;
  };
  keywords: {
    targetKeyword: string | null;
    keywordDensity: number | null;
    keywordInTitle: boolean;
    keywordInH1: boolean;
    keywordInDescription: boolean;
    keywordInFirst100Words: boolean;
    keywordOccurrences: number;
  };
  readability: {
    avgSentenceLength: number;
    avgWordLength: number;
    estimatedReadingTimeMin: number;
    shortParagraphs: number;
    longParagraphs: number;
  };
  links: {
    internalCount: number;
    externalCount: number;
    nofollowCount: number;
    brokenInternalSample: string[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
    missingAltUrls: string[];
  };
  scores: {
    content: number;
    headings: number;
    keywords: number;
    readability: number;
    links: number;
    images: number;
    overall: number;
  };
  recommendations: string[];
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

export const contentAnalyzerSkill: SkillDefinition = {
  name: "content-analyzer",
  description:
    "Analyze a page's content for SEO quality. Evaluates word count, heading structure, keyword density, readability, internal/external links, and image alt tags. Returns scores and actionable recommendations.",
  group: "seo",
  parameters: z.object({
    url: z.string().url().describe("URL of the page to analyze"),
    targetKeyword: z
      .string()
      .optional()
      .describe("Target keyword to check density and placement for"),
  }),
  execute: async (params) => {
    const { url, targetKeyword } = params as {
      url: string;
      targetKeyword?: string;
    };

    const manager = BrowserManager.getInstance();
    const page = await manager.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

      const rawData = await withTimeout(
        page.evaluate((kw?: string) => {
          const body = document.body;
          const text = body?.innerText || body?.textContent || "";
          const title = document.title;
          const metaDesc =
            document
              .querySelector('meta[name="description"]')
              ?.getAttribute("content") ?? "";

          // Headings
          const getHeadings = (tag: string) =>
            Array.from(document.querySelectorAll(tag))
              .map((h) => h.textContent?.trim() ?? "")
              .filter(Boolean);
          const h1 = getHeadings("h1");
          const h2 = getHeadings("h2");
          const h3 = getHeadings("h3");
          const h4 = getHeadings("h4");
          const h5 = getHeadings("h5");
          const h6 = getHeadings("h6");

          // Links
          const allLinks = Array.from(document.querySelectorAll("a[href]"));
          const pageOrigin = window.location.origin;
          let internalCount = 0;
          let externalCount = 0;
          let nofollowCount = 0;
          for (const a of allLinks) {
            const anchor = a as HTMLAnchorElement;
            try {
              const linkUrl = new URL(anchor.href);
              if (linkUrl.origin === pageOrigin) {
                internalCount++;
              } else {
                externalCount++;
              }
            } catch {
              internalCount++; // relative links are internal
            }
            if (anchor.getAttribute("rel")?.includes("nofollow")) {
              nofollowCount++;
            }
          }

          // Images
          const allImages = Array.from(document.querySelectorAll("img"));
          const imagesWithAlt = allImages.filter(
            (img) => img.getAttribute("alt")?.trim()
          );
          const missingAltUrls = allImages
            .filter((img) => !img.getAttribute("alt")?.trim())
            .slice(0, 10)
            .map((img) => img.src || img.getAttribute("data-src") || "[no src]");

          // Paragraphs
          const paragraphs = Array.from(document.querySelectorAll("p"))
            .map((p) => p.textContent?.trim() ?? "")
            .filter(Boolean);

          return {
            text: text.slice(0, 80000),
            title,
            metaDescription: metaDesc,
            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            internalCount,
            externalCount,
            nofollowCount,
            totalImages: allImages.length,
            imagesWithAlt: imagesWithAlt.length,
            missingAltUrls,
            paragraphs: paragraphs.slice(0, 200),
          };
        }, targetKeyword),
        20000,
        "Content analysis page.evaluate()"
      );

      // Process text analysis
      const words = rawData.text
        .split(/\s+/)
        .filter((w) => w.length > 0);
      const wordCount = words.length;

      // Sentence analysis
      const sentences = rawData.text
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 5);
      const avgSentenceLength =
        sentences.length > 0
          ? Math.round(wordCount / sentences.length)
          : 0;
      const avgWordLength =
        words.length > 0
          ? Math.round(
              (words.reduce((sum, w) => sum + w.length, 0) / words.length) * 10
            ) / 10
          : 0;
      const readingTimeMin = Math.max(1, Math.round(wordCount / 250));

      // Paragraph length analysis
      const shortParagraphs = rawData.paragraphs.filter(
        (p) => p.split(/\s+/).length < 20
      ).length;
      const longParagraphs = rawData.paragraphs.filter(
        (p) => p.split(/\s+/).length > 150
      ).length;

      // Keyword analysis
      let keywordDensity: number | null = null;
      let keywordInTitle = false;
      let keywordInH1 = false;
      let keywordInDescription = false;
      let keywordInFirst100Words = false;
      let keywordOccurrences = 0;

      if (targetKeyword) {
        const kwLower = targetKeyword.toLowerCase();
        const textLower = rawData.text.toLowerCase();
        const regex = new RegExp(kwLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        const matches = textLower.match(regex);
        keywordOccurrences = matches?.length ?? 0;
        keywordDensity =
          wordCount > 0
            ? Math.round((keywordOccurrences / wordCount) * 10000) / 100
            : 0;
        keywordInTitle = rawData.title.toLowerCase().includes(kwLower);
        keywordInH1 = rawData.h1.some((h) =>
          h.toLowerCase().includes(kwLower)
        );
        keywordInDescription = rawData.metaDescription
          .toLowerCase()
          .includes(kwLower);
        const first100 = words.slice(0, 100).join(" ").toLowerCase();
        keywordInFirst100Words = first100.includes(kwLower);
      }

      // Scoring
      const scores = { content: 0, headings: 0, keywords: 0, readability: 0, links: 0, images: 0, overall: 0 };

      // Content score (max 20)
      if (wordCount >= 300) scores.content += 5;
      if (wordCount >= 600) scores.content += 5;
      if (wordCount >= 1000) scores.content += 5;
      if (wordCount >= 1500) scores.content += 5;

      // Heading score (max 20)
      if (rawData.h1.length === 1) scores.headings += 8;
      else if (rawData.h1.length > 0) scores.headings += 3;
      if (rawData.h2.length > 0) scores.headings += 6;
      if (rawData.h2.length >= 2) scores.headings += 3;
      if (rawData.h3.length > 0) scores.headings += 3;

      // Keyword score (max 20)
      if (targetKeyword) {
        if (keywordInTitle) scores.keywords += 5;
        if (keywordInH1) scores.keywords += 5;
        if (keywordInDescription) scores.keywords += 3;
        if (keywordInFirst100Words) scores.keywords += 3;
        if (keywordDensity !== null && keywordDensity >= 0.5 && keywordDensity <= 2.5) {
          scores.keywords += 4;
        } else if (keywordDensity !== null && keywordDensity > 0) {
          scores.keywords += 2;
        }
      } else {
        scores.keywords = 10; // Neutral when no keyword specified
      }

      // Readability score (max 20)
      if (avgSentenceLength >= 10 && avgSentenceLength <= 20) scores.readability += 8;
      else if (avgSentenceLength > 0 && avgSentenceLength <= 25) scores.readability += 4;
      if (longParagraphs === 0) scores.readability += 6;
      else if (longParagraphs <= 2) scores.readability += 3;
      if (readingTimeMin >= 3 && readingTimeMin <= 10) scores.readability += 6;
      else if (readingTimeMin >= 1) scores.readability += 3;

      // Link score (max 10)
      if (rawData.internalCount >= 2) scores.links += 4;
      else if (rawData.internalCount >= 1) scores.links += 2;
      if (rawData.externalCount >= 1) scores.links += 3;
      if (rawData.internalCount + rawData.externalCount >= 5) scores.links += 3;

      // Image score (max 10)
      if (rawData.totalImages > 0) scores.images += 4;
      if (rawData.totalImages > 0 && rawData.imagesWithAlt === rawData.totalImages) {
        scores.images += 6;
      } else if (rawData.imagesWithAlt > 0) {
        scores.images += 3;
      }

      scores.overall = scores.content + scores.headings + scores.keywords + scores.readability + scores.links + scores.images;

      // Recommendations
      const recommendations: string[] = [];

      if (wordCount < 300) {
        recommendations.push(
          `Content is thin at ${wordCount} words. Aim for at least 600-1000 words for better ranking potential.`
        );
      } else if (wordCount < 600) {
        recommendations.push(
          `Content is ${wordCount} words. Consider expanding to 1000+ words for competitive keywords.`
        );
      }

      if (rawData.h1.length === 0) {
        recommendations.push("Missing H1 tag. Add a single, descriptive H1 heading.");
      } else if (rawData.h1.length > 1) {
        recommendations.push(
          `Found ${rawData.h1.length} H1 tags. Use only one H1 per page for clear hierarchy.`
        );
      }

      if (rawData.h2.length === 0) {
        recommendations.push(
          "No H2 subheadings found. Break content into sections with descriptive H2 headings."
        );
      }

      if (targetKeyword) {
        if (!keywordInTitle)
          recommendations.push(`Add target keyword "${targetKeyword}" to the page title.`);
        if (!keywordInH1)
          recommendations.push(`Add target keyword "${targetKeyword}" to the H1 heading.`);
        if (!keywordInDescription)
          recommendations.push(
            `Add target keyword "${targetKeyword}" to the meta description.`
          );
        if (!keywordInFirst100Words)
          recommendations.push(
            `Include target keyword "${targetKeyword}" in the first 100 words of content.`
          );
        if (keywordDensity !== null && keywordDensity > 2.5)
          recommendations.push(
            `Keyword density is ${keywordDensity}% which may be too high. Aim for 0.5-2.5% to avoid over-optimization.`
          );
        if (keywordDensity !== null && keywordDensity < 0.5 && keywordOccurrences > 0)
          recommendations.push(
            `Keyword density is ${keywordDensity}%. Consider naturally using the keyword more often (aim for 0.5-2.5%).`
          );
        if (keywordOccurrences === 0)
          recommendations.push(
            `Target keyword "${targetKeyword}" was not found in the page content.`
          );
      }

      if (avgSentenceLength > 25) {
        recommendations.push(
          `Average sentence length is ${avgSentenceLength} words. Break up long sentences for better readability.`
        );
      }

      if (longParagraphs > 0) {
        recommendations.push(
          `${longParagraphs} paragraph(s) are very long (150+ words). Break them into shorter paragraphs.`
        );
      }

      if (rawData.internalCount === 0) {
        recommendations.push(
          "No internal links found. Add links to related pages on your site."
        );
      }

      if (rawData.externalCount === 0) {
        recommendations.push(
          "No external links found. Link to authoritative sources to build trust."
        );
      }

      if (rawData.totalImages === 0) {
        recommendations.push(
          "No images found. Add relevant images to improve engagement and provide visual content."
        );
      } else if (rawData.missingAltUrls.length > 0) {
        recommendations.push(
          `${rawData.missingAltUrls.length} image(s) missing alt text. Add descriptive alt attributes for accessibility and SEO.`
        );
      }

      const analysis: ContentAnalysis = {
        url,
        title: rawData.title,
        metaDescription: rawData.metaDescription,
        wordCount,
        headingStructure: {
          h1: rawData.h1,
          h2: rawData.h2,
          h3: rawData.h3,
          h4: rawData.h4,
          h5: rawData.h5,
          h6: rawData.h6,
          totalHeadings:
            rawData.h1.length +
            rawData.h2.length +
            rawData.h3.length +
            rawData.h4.length +
            rawData.h5.length +
            rawData.h6.length,
          hasMultipleH1s: rawData.h1.length > 1,
          missingH1: rawData.h1.length === 0,
        },
        keywords: {
          targetKeyword: targetKeyword ?? null,
          keywordDensity,
          keywordInTitle,
          keywordInH1,
          keywordInDescription,
          keywordInFirst100Words,
          keywordOccurrences,
        },
        readability: {
          avgSentenceLength,
          avgWordLength,
          estimatedReadingTimeMin: readingTimeMin,
          shortParagraphs,
          longParagraphs,
        },
        links: {
          internalCount: rawData.internalCount,
          externalCount: rawData.externalCount,
          nofollowCount: rawData.nofollowCount,
          brokenInternalSample: [],
        },
        images: {
          total: rawData.totalImages,
          withAlt: rawData.imagesWithAlt,
          withoutAlt: rawData.totalImages - rawData.imagesWithAlt,
          missingAltUrls: rawData.missingAltUrls,
        },
        scores: {
          content: scores.content,
          headings: scores.headings,
          keywords: scores.keywords,
          readability: scores.readability,
          links: scores.links,
          images: scores.images,
          overall: scores.overall,
        },
        recommendations,
      };

      return JSON.stringify(analysis);
    } catch (err) {
      return JSON.stringify({
        error: `Content analysis failed: ${(err as Error).message}`,
      });
    } finally {
      await page.close();
    }
  },
};
