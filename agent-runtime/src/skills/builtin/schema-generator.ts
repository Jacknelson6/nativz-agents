import { z } from "zod";
import type { SkillDefinition } from "../registry.js";

const SCHEMA_TYPES = [
  "Article",
  "FAQPage",
  "HowTo",
  "Product",
  "LocalBusiness",
  "BreadcrumbList",
  "Organization",
  "WebSite",
] as const;

type SchemaType = (typeof SCHEMA_TYPES)[number];

interface PageData {
  title: string;
  metaDescription: string;
  h1s: string[];
  h2s: string[];
  text: string;
  url: string;
  links: Array<{ text: string; href: string }>;
  images: Array<{ src: string; alt: string }>;
  lang: string;
}

async function fetchPageData(url: string): Promise<PageData> {
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
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() ?? "";

  const metaDescMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i
  );
  const metaDescription = metaDescMatch?.[1]?.trim() ?? "";

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1s = h1Matches.map((m) => m[1].replace(/<[^>]+>/g, "").trim());

  const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const h2s = h2Matches.map((m) => m[1].replace(/<[^>]+>/g, "").trim());

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] ?? html;
  const text = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000);

  const linkMatches = [
    ...html.matchAll(/<a[^>]+href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi),
  ];
  const links = linkMatches.slice(0, 50).map((m) => ({
    href: m[1],
    text: m[2].replace(/<[^>]+>/g, "").trim(),
  }));

  const imgMatches = [
    ...html.matchAll(
      /<img[^>]+src=["']([^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?/gi
    ),
  ];
  const images = imgMatches.slice(0, 30).map((m) => ({
    src: m[1],
    alt: m[2] ?? "",
  }));

  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  const lang = langMatch?.[1] ?? "en";

  return { title, metaDescription, h1s, h2s, text, url, links, images, lang };
}

function generateArticleSchema(page: PageData): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.h1s[0] || page.title,
    description: page.metaDescription || page.text.slice(0, 160),
    url: page.url,
    inLanguage: page.lang,
    ...(page.images.length > 0 && { image: page.images[0].src }),
    author: {
      "@type": "Person",
      name: "[Author Name]",
    },
    publisher: {
      "@type": "Organization",
      name: "[Publisher Name]",
    },
    datePublished: "[YYYY-MM-DD]",
    dateModified: "[YYYY-MM-DD]",
  };
}

function generateFAQSchema(page: PageData): Record<string, unknown> {
  const questions: Array<{ question: string; answer: string }> = [];
  const lines = page.text.split(/[.?!]\s+/);
  for (const heading of page.h2s.slice(0, 10)) {
    if (
      heading.includes("?") ||
      heading.toLowerCase().startsWith("how") ||
      heading.toLowerCase().startsWith("what") ||
      heading.toLowerCase().startsWith("why") ||
      heading.toLowerCase().startsWith("when") ||
      heading.toLowerCase().startsWith("can")
    ) {
      const answer =
        lines.find((l) =>
          l.toLowerCase().includes(heading.split(" ")[0].toLowerCase())
        ) || "[Answer text from page content]";
      questions.push({
        question: heading,
        answer: answer.trim().slice(0, 500),
      });
    }
  }

  if (questions.length === 0) {
    questions.push({
      question: "[Question from page content]",
      answer: "[Answer from page content]",
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

function generateHowToSchema(page: PageData): Record<string, unknown> {
  const steps = page.h2s.length > 0 ? page.h2s : page.h1s.slice(1);
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: page.h1s[0] || page.title,
    description: page.metaDescription || page.text.slice(0, 160),
    ...(page.images.length > 0 && { image: page.images[0].src }),
    step: steps.length > 0
      ? steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s,
          text: `[Step ${i + 1} details]`,
        }))
      : [
          {
            "@type": "HowToStep",
            position: 1,
            name: "[Step name]",
            text: "[Step details]",
          },
        ],
  };
}

function generateProductSchema(page: PageData): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: page.h1s[0] || page.title,
    description: page.metaDescription || page.text.slice(0, 160),
    url: page.url,
    ...(page.images.length > 0 && { image: page.images[0].src }),
    brand: {
      "@type": "Brand",
      name: "[Brand Name]",
    },
    offers: {
      "@type": "Offer",
      price: "[Price]",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: page.url,
    },
  };
}

function generateLocalBusinessSchema(
  page: PageData
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: page.h1s[0] || page.title,
    description: page.metaDescription || page.text.slice(0, 160),
    url: page.url,
    ...(page.images.length > 0 && { image: page.images[0].src }),
    address: {
      "@type": "PostalAddress",
      streetAddress: "[Street Address]",
      addressLocality: "[City]",
      addressRegion: "[State]",
      postalCode: "[ZIP]",
      addressCountry: "US",
    },
    telephone: "[Phone Number]",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "17:00",
      },
    ],
  };
}

function generateBreadcrumbSchema(page: PageData): Record<string, unknown> {
  const urlObj = new URL(page.url);
  const pathParts = urlObj.pathname
    .split("/")
    .filter((p) => p.length > 0);
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${urlObj.origin}/`,
    },
  ];
  let currentPath = "";
  for (let i = 0; i < pathParts.length; i++) {
    currentPath += `/${pathParts[i]}`;
    items.push({
      "@type": "ListItem",
      position: i + 2,
      name:
        pathParts[i].replace(/-/g, " ").replace(/\b\w/g, (c) =>
          c.toUpperCase()
        ),
      item: `${urlObj.origin}${currentPath}`,
    });
  }
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function generateOrganizationSchema(
  page: PageData
): Record<string, unknown> {
  const urlObj = new URL(page.url);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: page.title.split(/[|\-–—]/)[0]?.trim() || "[Organization Name]",
    url: urlObj.origin,
    description: page.metaDescription || page.text.slice(0, 160),
    ...(page.images.length > 0 && { logo: page.images[0].src }),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: "[Phone Number]",
      email: "[Email]",
    },
    sameAs: [
      "[Facebook URL]",
      "[Twitter URL]",
      "[LinkedIn URL]",
    ],
  };
}

function generateWebSiteSchema(page: PageData): Record<string, unknown> {
  const urlObj = new URL(page.url);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: page.title.split(/[|\-–—]/)[0]?.trim() || "[Site Name]",
    url: urlObj.origin,
    description: page.metaDescription || page.text.slice(0, 160),
    inLanguage: page.lang,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${urlObj.origin}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

const generators: Record<SchemaType, (page: PageData) => Record<string, unknown>> = {
  Article: generateArticleSchema,
  FAQPage: generateFAQSchema,
  HowTo: generateHowToSchema,
  Product: generateProductSchema,
  LocalBusiness: generateLocalBusinessSchema,
  BreadcrumbList: generateBreadcrumbSchema,
  Organization: generateOrganizationSchema,
  WebSite: generateWebSiteSchema,
};

export const schemaGeneratorSkill: SkillDefinition = {
  name: "schema-generator",
  description:
    "Generate JSON-LD structured data markup for a web page. Fetches the page, analyzes its content, and produces schema.org markup ready to paste into the page head.",
  group: "seo",
  parameters: z.object({
    url: z.string().url().describe("URL of the page to generate schema for"),
    schemaType: z
      .enum(SCHEMA_TYPES)
      .describe(
        "Type of schema to generate: Article, FAQPage, HowTo, Product, LocalBusiness, BreadcrumbList, Organization, or WebSite"
      ),
  }),
  execute: async (params) => {
    const { url, schemaType } = params as {
      url: string;
      schemaType: SchemaType;
    };
    try {
      const page = await fetchPageData(url);
      const generator = generators[schemaType];
      const schema = generator(page);
      const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;

      return JSON.stringify({
        schemaType,
        url,
        jsonLd: schema,
        scriptTag,
        notes: [
          "Replace placeholder values in square brackets [like this] with actual data.",
          "Validate at https://search.google.com/test/rich-results",
          `Schema type '${schemaType}' generated from page analysis.`,
        ],
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return JSON.stringify({
          error: "Page fetch timed out after 30 seconds",
        });
      }
      return JSON.stringify({
        error: `Schema generation failed: ${(err as Error).message}`,
      });
    }
  },
};
