"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";
import { fetchGeoJson } from "@/utils/geoUtils";
import {
  featureCollectionToArray,
  getFeatureDistrict,
  getFeatureId,
  getFeatureRegion,
} from "@/utils/featureUtils";

export type GeoLayerId =
  | "zidovske-pamatky"
  | "cirkevni-pamatky"
  | "prirodni-zajimavosti"
  | "turisticke-regiony"
  | "cyklovylety";

export type GeoCategory =
  | "pamatky"
  | "priroda"
  | "regiony"
  | "trasy";

export type GeometryKind = "point" | "line" | "polygon" | "mixed";

export type GeoLayerDefinition = {
  id: GeoLayerId;
  title: string;
  description: string;
  url: string;
  category: GeoCategory;
  color: string;
  geometry: GeometryKind;
  icon: string;
  /**
   * When true the layer is fetched immediately. Otherwise it will be lazy
   * loaded on first explicit request (např. při zapnutí ve vrstvě).
   */
  preload?: boolean;
  /**
   * Dodatečné vizuální nastavení (např. pro polygon nebo trasu).
   */
  style?: {
    weight?: number;
    dashArray?: string;
    fillOpacity?: number;
  };
};

export type GeoLayerState = Record<GeoLayerId, FeatureCollection | null>;
export type LoadingState = Record<GeoLayerId, boolean>;
export type ErrorState = Record<GeoLayerId, string | null>;

export type LayerMetadata = {
  districts: string[];
  regions: string[];
  featureCount: number;
};

export type FeatureIndexEntry = {
  layerId: GeoLayerId;
  feature: Feature;
};

const ARC_GIS_HOST =
  "https://services6.arcgis.com/ogJAiK65nXL1mXAW/arcgis/rest/services/";

const makeArcGisUrl = (service: string) =>
  `${ARC_GIS_HOST}${encodeURIComponent(service)}/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson`;

const DEFAULT_LAYERS: GeoLayerDefinition[] = [
  {
    id: "zidovske-pamatky",
    title: "Židovské památky",
    description: "Synagogy, židovské hřbitovy a další památky židovského dědictví.",
    url: makeArcGisUrl("Židovské_památky"),
    category: "pamatky",
    color: "#f59e0b",
    geometry: "point",
    icon: "star-of-david",
    preload: true,
  },
  {
    id: "cirkevni-pamatky",
    title: "Církevní památky",
    description: "Kostely, kaple a další sakrální stavby v kraji.",
    url: makeArcGisUrl("Církevní_památky"),
    category: "pamatky",
    color: "#dc2626",
    geometry: "point",
    icon: "church",
  },
  {
    id: "prirodni-zajimavosti",
    title: "Přírodní zajímavosti",
    description: "Národní přírodní památky, rezervace a další přírodní cíle.",
    url: makeArcGisUrl("Přírodní_zajímavosti"),
    category: "priroda",
    color: "#16a34a",
    geometry: "mixed",
    icon: "tree",
  },
  {
    id: "turisticke-regiony",
    title: "Turistické regiony",
    description: "Oficiálně vymezené turistické oblasti Královéhradeckého kraje.",
    url: makeArcGisUrl("Turistické_regiony"),
    category: "regiony",
    color: "#2563eb",
    geometry: "polygon",
    icon: "map",
    style: {
      fillOpacity: 0.2,
      weight: 2,
    },
  },
  {
    id: "cyklovylety",
    title: "Cyklovýlety",
    description: "Doporučené cyklotrasy v celém kraji.",
    url: makeArcGisUrl("Cyklovýlety"),
    category: "trasy",
    color: "#0891b2",
    geometry: "line",
    icon: "bike",
    style: {
      weight: 4,
      dashArray: "6 8",
    },
  },
];

function createInitialState<T>(value: T): Record<GeoLayerId, T> {
  return DEFAULT_LAYERS.reduce(
    (acc, layer) => ({
      ...acc,
      [layer.id]: value,
    }),
    {} as Record<GeoLayerId, T>,
  );
}

function extractMetadata(collection: FeatureCollection | null): LayerMetadata {
  if (!collection) {
    return { districts: [], regions: [], featureCount: 0 };
  }
  const districts = new Set<string>();
  const regions = new Set<string>();

  for (const feature of featureCollectionToArray(collection)) {
    const district = getFeatureDistrict(feature);
    if (district) {
      districts.add(district);
    }
    const region = getFeatureRegion(feature);
    if (region) {
      regions.add(region);
    }
  }

  const collator = new Intl.Collator("cs");
  return {
    districts: Array.from(districts).sort(collator.compare),
    regions: Array.from(regions).sort(collator.compare),
    featureCount: collection.features.length,
  };
}

export function useGeoData(customLayers?: GeoLayerDefinition[]) {
  const layerConfig = useMemo(
    () => customLayers ?? DEFAULT_LAYERS,
    [customLayers],
  );

  const [data, setData] = useState<GeoLayerState>(() =>
    createInitialState<FeatureCollection | null>(null),
  );
  const [loading, setLoading] = useState<LoadingState>(() =>
    createInitialState<boolean>(false),
  );
  const [errors, setErrors] = useState<ErrorState>(() =>
    createInitialState<string | null>(null),
  );

  const loadLayer = useCallback(
    async (layerId: GeoLayerId) => {
      const layer = layerConfig.find((item) => item.id === layerId);
      if (!layer) {
        setErrors((prev) => ({
          ...prev,
          [layerId]: `Neznámá vrstva: ${layerId}`,
        }));
        return;
      }

      setLoading((prev) => ({ ...prev, [layerId]: true }));
      setErrors((prev) => ({ ...prev, [layerId]: null }));

      try {
        const geojson = await fetchGeoJson(layer.url, {
        });
        setData((prev) => ({ ...prev, [layerId]: geojson }));
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Nepodařilo se načíst GeoJSON data.";
        setErrors((prev) => ({ ...prev, [layerId]: message }));
      } finally {
        setLoading((prev) => ({ ...prev, [layerId]: false }));
      }
    },
    [layerConfig],
  );

  const preloadLayers = useCallback(() => {
    layerConfig
      .filter((layer) => layer.preload)
      .forEach((layer) => {
        void loadLayer(layer.id);
      });
  }, [layerConfig, loadLayer]);

  useEffect(() => {
    preloadLayers();
  }, [preloadLayers]);

  const metadataByLayer = useMemo(() => {
    return layerConfig.reduce((acc, layer) => {
      acc[layer.id] = extractMetadata(data[layer.id]);
      return acc;
    }, {} as Record<GeoLayerId, LayerMetadata>);
  }, [data, layerConfig]);

  const featureIndex = useMemo(() => {
    const entries = new Map<string, FeatureIndexEntry>();
    for (const layer of layerConfig) {
      const collection = data[layer.id];
      if (!collection) continue;
      for (const feature of featureCollectionToArray(collection)) {
        entries.set(`${layer.id}:${getFeatureId(feature)}`, {
          layerId: layer.id,
          feature,
        });
      }
    }
    return entries;
  }, [data, layerConfig]);

  const getFeatureByCompoundId = useCallback(
    (compoundId: string) => {
      return featureIndex.get(compoundId) ?? null;
    },
    [featureIndex],
  );

  const getFeatureByLayerAndId = useCallback(
    (layerId: GeoLayerId, featureId: string) => {
      const collection = data[layerId];
      if (!collection) return null;
      return (
        featureCollectionToArray(collection).find(
          (feature) => getFeatureId(feature) === featureId,
        ) ?? null
      );
    },
    [data],
  );

  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    for (const meta of Object.values(metadataByLayer)) {
      meta.districts.forEach((district) => set.add(district));
    }
    return Array.from(set).sort(new Intl.Collator("cs").compare);
  }, [metadataByLayer]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    for (const meta of Object.values(metadataByLayer)) {
      meta.regions.forEach((region) => set.add(region));
    }
    return Array.from(set).sort(new Intl.Collator("cs").compare);
  }, [metadataByLayer]);

  const isLoading = layerConfig.some((layer) => loading[layer.id]);
  const firstError =
    layerConfig.map((layer) => errors[layer.id]).find(Boolean) ?? null;

  return {
    layers: layerConfig,
    data,
    loading,
    isLoading,
    errors,
    error: firstError,
    loadLayer,
    reloadLayer: loadLayer,
    metadataByLayer,
    featureIndex,
    getFeatureByCompoundId,
    getFeatureByLayerAndId,
    availableDistricts,
    availableRegions,
  };
}
