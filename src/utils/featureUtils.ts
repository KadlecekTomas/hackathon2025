import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { FavoriteFeature } from "@/utils/storageUtils";

type FeatureProperties = Record<string, unknown> | undefined;

function normalizeKey(key: string) {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildPropertyLookup(
  feature: Feature,
): Map<string, unknown> | null {
  const props = feature.properties as Record<string, unknown> | undefined;
  if (!props) return null;
  const lookup = new Map<string, unknown>();
  for (const [key, value] of Object.entries(props)) {
    lookup.set(key, value);
    lookup.set(key.toLowerCase(), value);
    lookup.set(normalizeKey(key), value);
  }
  return lookup;
}

function readProperty<T>(
  feature: Feature,
  candidates: string[],
): T | undefined {
  const props = feature.properties as FeatureProperties;
  if (!props) return undefined;

  for (const key of candidates) {
    if (key in props) {
      return props[key] as T;
    }
  }

  const lookup = buildPropertyLookup(feature);
  if (!lookup) return undefined;

  for (const key of candidates) {
    const normalized = normalizeKey(key);
    if (lookup.has(normalized)) {
      return lookup.get(normalized) as T;
    }
  }

  return undefined;
}

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
  const description =
    readProperty<string>(feature, [
      "POPIS",
      "POPIS_DET",
      "text",
      "Description",
      "description",
      "Popis",
      "POPIS_TEXT",
    ]) ?? null;
  if (typeof description === "string" && description.trim().length > 0) {
    return description;
  }
  return "Bez popisu.";
}

export function getFeatureLength(feature: Feature): string | null {
  const raw = readProperty<unknown>(feature, [
    "DELKA",
    "DELKA_KM",
    "DELKA_TRASY",
    "delka",
    "Delka",
  ]);
  if (typeof raw === "number") {
    return `${raw.toFixed(1)} km`;
  }
  if (typeof raw === "string") {
    return raw;
  }
  return null;
}

export function getFeaturePhone(feature: Feature): string | null {
  const value = readProperty<string>(feature, [
    "TELEFON",
    "telefon",
    "phone",
    "TEL",
  ]);
  return value ?? null;
}

export function getFeatureWebsite(feature: Feature): string | null {
  const value = readProperty<string>(feature, [
    "WEB",
    "web",
    "URL",
    "url",
    "Link",
  ]);
  return value ?? null;
}

export function getFeatureMunicipality(feature: Feature): string | null {
  const value = readProperty<string>(feature, [
    "OBEC",
    "MESTO",
    "obec",
    "město",
    "NAZEV_OBCE",
    "Nazev_obce",
  ]);
  return value ?? null;
}

export function getFeatureRegion(feature: Feature): string | null {
  const value = readProperty<string>(feature, [
    "KRAJ",
    "REGION",
    "kraj",
    "region",
    "NAZEV_REGIONU",
    "Nazev_regionu",
  ]);
  return value ?? null;
}

export function getFeatureDistrict(feature: Feature): string | null {
  const value = readProperty<string>(feature, [
    "NAZEV_OKRESU",
    "Nazev_okresu",
    "OKRES",
    "okres",
    "Okres",
  ]);
  return value ?? null;
}

export function getFeatureCategoryHint(feature: Feature): string | null {
  const value = readProperty<string>(feature, [
    "TYP",
    "Typ",
    "KATEGORIE",
    "Kategorie",
    "DRUH",
    "Druh",
    "OBOR",
    "Obor",
  ]);
  return value ?? null;
}

export function featureToFavorite(
  feature: Feature,
  layerId: string,
  layerTitle?: string,
): FavoriteFeature {
  return {
    id: getFeatureId(feature),
    layerId,
    layerTitle,
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

function flattenCoordinates(geometry: Geometry): [number, number][] {
  switch (geometry.type) {
    case "Point":
      return [geometry.coordinates as [number, number]];
    case "MultiPoint":
      return (geometry.coordinates as [number, number][]).slice();
    case "LineString":
      return geometry.coordinates as [number, number][];
    case "MultiLineString":
      return (geometry.coordinates as [number, number][][]).flat();
    case "Polygon":
      return (geometry.coordinates as [number, number][][])[0] ?? [];
    case "MultiPolygon":
      return (geometry.coordinates as [number, number][][][]).flat(2);
    default:
      return [];
  }
}

export function getFeatureCenter(
  feature: Feature,
): [number, number] | null {
  const geometry = feature.geometry;
  if (!geometry) return null;
  const points = flattenCoordinates(geometry);
  if (points.length === 0) return null;
  const [sumLng, sumLat] = points.reduce(
    (acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat],
    [0, 0],
  );
  return [sumLat / points.length, sumLng / points.length];
}

export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) *
      Math.sin(dLng / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return R * c;
}
