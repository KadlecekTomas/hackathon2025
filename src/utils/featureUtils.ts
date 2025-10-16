import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { FavoriteFeature } from "@/utils/storageUtils";

function generateRandomId(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) return randomUuid;
  return `feature-${Math.random().toString(36).slice(2, 11)}`;
}

export function getFeatureId(feature: Feature): string {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    feature.id,
    props?.OBJECTID,
    props?.FID,
    props?.id,
    props?.globalid,
    props?.GlobalID,
  ];

  const resolved = candidates.find(
    (candidate) =>
      typeof candidate === "string" ||
      typeof candidate === "number" ||
      typeof candidate === "bigint",
  );

  return String(resolved ?? generateRandomId());
}

export function getFeatureTitle(feature: Feature): string {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    props?.NAZEV,
    props?.NAZEV_TRASY,
    props?.NAZEV_PRODUKTU,
    props?.nazev,
    props?.Name,
    props?.title,
    props?.TITULEK,
  ];
  const result = candidates.find((item) => typeof item === "string");
  return (result as string | undefined) ?? "Neznámá lokalita";
}

export function getFeatureDescription(feature: Feature): string {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    props?.POPIS,
    props?.POPIS_DET,
    props?.text,
    props?.description,
  ];
  const result = candidates.find((item) => typeof item === "string");
  return (result as string | undefined) ?? "Bez popisu.";
}

export function getFeatureLength(feature: Feature): string | null {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [
    props?.DELKA,
    props?.DELKA_KM,
    props?.DELKA_TRASY,
    props?.delka,
  ];
  const result = candidates.find(
    (item) => typeof item === "number" || typeof item === "string",
  );
  if (typeof result === "number") {
    return `${result.toFixed(1)} km`;
  }
  if (typeof result === "string") {
    return result;
  }
  return null;
}

export function getFeaturePhone(feature: Feature): string | null {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [props?.TELEFON, props?.telefon, props?.phone];
  const result = candidates.find((item) => typeof item === "string");
  return (result as string | undefined) ?? null;
}

export function getFeatureWebsite(feature: Feature): string | null {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [props?.WEB, props?.web, props?.URL];
  const result = candidates.find((item) => typeof item === "string");
  return (result as string | undefined) ?? null;
}

export function getFeatureMunicipality(feature: Feature): string | null {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [props?.OBEC, props?.MESTO, props?.obec];
  const result = candidates.find((item) => typeof item === "string");
  return (result as string | undefined) ?? null;
}

export function getFeatureRegion(feature: Feature): string | null {
  const props = feature.properties as Record<string, unknown> | undefined;
  const candidates: unknown[] = [props?.KRAJ, props?.REGION, props?.kraj];
  const result = candidates.find((item) => typeof item === "string");
  return (result as string | undefined) ?? null;
}

export function featureToFavorite(
  feature: Feature,
  layerId: string,
): FavoriteFeature {
  return {
    id: getFeatureId(feature),
    layerId,
    title: getFeatureTitle(feature),
    geometryType: feature.geometry?.type,
    properties: feature.properties as Record<string, unknown> | undefined,
  };
}

export function featureCollectionToArray(collection?: FeatureCollection) {
  if (!collection) return [] as Feature[];
  return collection.features;
}

export function ensureGeometryArray(geometry: Geometry | Geometry[] | null) {
  if (!geometry) return [];
  return Array.isArray(geometry) ? geometry : [geometry];
}
