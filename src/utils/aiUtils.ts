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
};

const CATEGORY_LABELS: Record<string, string> = {
  pamatky: "Historická památka",
  priroda: "Přírodní lokalita",
  regiony: "Turistický region",
  trasy: "Cyklotrasa",
};

export function mapFeatureToAIFeature(
  layer: GeoLayerDefinition,
  feature: Feature,
): AIFeature {
  const title = getFeatureTitle(feature);
  const description = getFeatureDescription(feature);
  const region = getFeatureRegion(feature);
  const district = getFeatureDistrict(feature);
  const categoryHint = getFeatureCategoryHint(feature);

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
    typeLabel:
      CATEGORY_LABELS[layer.category] ??
      (categoryHint ?? "Zážitková lokalita"),
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
  const basic = description.length > 0 ? description : aiFeature.typeLabel;

  if (aiFeature.categoryHint) {
    return `${aiFeature.categoryHint}. ${basic}`;
  }
  return basic;
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
  const slots = ["9:00 —", "12:30 —", "15:00 —"];
  return plan.slice(0, 3).map((item, index) => {
    const summary = buildFriendlySummary(item);
    return `${slots[index] ?? ""} ${item.title} · ${summary}`;
  });
}
