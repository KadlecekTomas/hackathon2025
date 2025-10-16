import type { Feature } from "geojson";
import type { GeoLayerDefinition } from "@/hooks/useGeoData";
import {
  getFeatureCategoryHint,
  getFeatureDescription,
  getFeatureDistrict,
  getFeatureId,
  getFeatureRegion,
  getFeatureTitle,
} from "@/utils/featureUtils";

export type AIFeature = {
  id: string;
  layerId: string;
  layerTitle: string;
  color: string;
  feature: Feature;
  title: string;
  description: string;
  region: string | null;
  district: string | null;
  categoryHint: string | null;
  typeLabel: string;
  keywords: string[];
  searchText: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  pamatky: "Historická památka",
  priroda: "Přírodní lokalita",
  regiony: "Turistický region",
  trasy: "Cyklotrasa",
};

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  pamatky: [
    "historie",
    "památky",
    "kulturní",
    "architektura",
    "hrad",
    "zámek",
    "kostel",
    "synagoga",
  ],
  priroda: [
    "příroda",
    "výhled",
    "rezervace",
    "klid",
    "turistika",
    "procházka",
    "chráněná oblast",
  ],
  regiony: ["oblast", "region", "destinace", "turistická oblast"],
  trasy: [
    "cyklotrasa",
    "kolo",
    "cyklo",
    "výlet na kole",
    "trasa",
    "rodinný výlet",
  ],
};

const BASE_KEYWORDS = [
  "doporučení",
  "tip",
  "výlet",
  "zážitky",
  "poznávání",
  "rodina",
];

export const SEARCH_STOP_WORDS = new Set<string>([
  "chci",
  "hledam",
  "potrebuju",
  "najdu",
  "prosim",
  "nejaky",
  "nejaka",
  "nejake",
  "nejakou",
  "u",
  "v",
  "ve",
  "na",
  "do",
  "okolo",
  "okoli",
  "kolem",
  "blizko",
  "blizkosti",
]);

export function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeForSearch(text: string): string {
  return normalizeWhitespace(stripDiacritics(text).toLowerCase());
}

export function tokenize(text: string): string[] {
  return normalizeForSearch(text)
    .split(/[^a-z0-9]+/i)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function unique<T>(items: Iterable<T>): T[] {
  return Array.from(new Set(items));
}

type KeywordContext = {
  title: string;
  description: string;
  layerTitle: string;
  typeLabel: string;
  categoryHint: string | null;
  category: string;
  region: string | null;
  district: string | null;
};

function buildKeywords(context: KeywordContext): string[] {
  const keywords = new Set<string>();

  const pushTokens = (value: string | null | undefined) => {
    if (!value) return;
    tokenize(value).forEach((token) => {
      if (token.length === 0) return;
      keywords.add(token);
    });
  };

  const pushPhrase = (value: string | null | undefined) => {
    if (!value) return;
    keywords.add(normalizeForSearch(value));
  };

  pushTokens(context.title);
  pushTokens(context.layerTitle);
  pushTokens(context.typeLabel);
  pushTokens(context.description);
  pushTokens(context.categoryHint ?? "");

  const synonyms = CATEGORY_SYNONYMS[context.category] ?? [];
  synonyms.forEach((word) => pushTokens(word));
  BASE_KEYWORDS.forEach((word) => pushTokens(word));

  if (context.region) {
    pushTokens(context.region);
    pushPhrase(`region ${context.region}`);
    pushPhrase(`oblast ${context.region}`);
  }

  if (context.district) {
    pushTokens(context.district);
    pushPhrase(`okres ${context.district}`);
    pushPhrase(`u ${context.district}`);
    pushPhrase(`blízko ${context.district}`);
  }

  return unique(keywords);
}

function buildSearchText(context: KeywordContext): string {
  const parts: string[] = [
    normalizeForSearch(context.title),
    normalizeForSearch(context.description),
    normalizeForSearch(context.layerTitle),
    normalizeForSearch(context.typeLabel),
  ];

  if (context.categoryHint) {
    parts.push(normalizeForSearch(context.categoryHint));
  }
  if (context.region) {
    parts.push(normalizeForSearch(context.region));
  }
  if (context.district) {
    parts.push(normalizeForSearch(context.district));
  }

  const keywords = buildKeywords(context);
  parts.push(normalizeForSearch(keywords.join(" ")));

  return unique(parts).join(" ");
}

export function mapFeatureToAIFeature(
  layer: GeoLayerDefinition,
  feature: Feature,
): AIFeature {
  const title = getFeatureTitle(feature);
  const description = getFeatureDescription(feature);
  const region = getFeatureRegion(feature);
  const district = getFeatureDistrict(feature);
  const categoryHint = getFeatureCategoryHint(feature);
  const typeLabel =
    CATEGORY_LABELS[layer.category] ??
    (categoryHint ?? "Zážitková lokalita");
  const keywordContext: KeywordContext = {
    title,
    description,
    layerTitle: layer.title,
    typeLabel,
    categoryHint,
    category: layer.category,
    region,
    district,
  };
  const keywords = buildKeywords(keywordContext);
  const searchText = buildSearchText(keywordContext);

  return {
    id: `${layer.id}:${getFeatureId(feature)}`,
    layerId: layer.id,
    layerTitle: layer.title,
    color: layer.color,
    feature,
    title,
    description,
    region,
    district,
    categoryHint,
    typeLabel,
    keywords,
    searchText,
  };
}

export function summarizeFeature(aiFeature: AIFeature): string {
  const parts = [aiFeature.typeLabel];
  if (aiFeature.district) {
    parts.push(`okres ${aiFeature.district}`);
  }
  if (aiFeature.region && aiFeature.region !== aiFeature.district) {
    parts.push(aiFeature.region);
  }
  if (aiFeature.categoryHint) {
    parts.push(aiFeature.categoryHint);
  }
  return parts.join(" · ");
}

export function buildFriendlySummary(aiFeature: AIFeature): string {
  const description = aiFeature.description.replace(/\s+/g, " ").trim();
  const locationParts: string[] = [];
  if (aiFeature.district) {
    locationParts.push(`v okrese ${aiFeature.district}`);
  }
  if (aiFeature.region && aiFeature.region !== aiFeature.district) {
    locationParts.push(`v regionu ${aiFeature.region}`);
  }
  const place = locationParts.length > 0 ? locationParts.join(" ") : "";

  const lead =
    aiFeature.categoryHint ??
    (aiFeature.typeLabel !== aiFeature.title
      ? aiFeature.typeLabel
      : "Zajímavé místo");

  const detail =
    description.length > 0 && description !== "Bez popisu."
      ? description
      : `${lead} nabízí příjemný tip na výlet.`;

  const finalSummary = `${lead}${place ? ` ${place}` : ""}. ${detail}`;
  return normalizeWhitespace(finalSummary);
}

export function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function pickDistinct(
  items: AIFeature[],
  predicate: (item: AIFeature) => boolean,
): AIFeature | null {
  const filtered = items.filter(predicate);
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function buildPlanNarrative(plan: AIFeature[]): string[] {
  const slots = ["", "", ""];
  return plan.slice(0, 3).map((item, index) => {
    const summary = buildFriendlySummary(item);
    return `${slots[index] ?? ""} ${item.title} · ${summary}`;
  });
}
