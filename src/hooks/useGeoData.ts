"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FeatureCollection } from "geojson";
import { fetchGeoJson } from "@/utils/geoUtils";

export type GeoCategory = "cyklotrasy" | "pamatky" | "priroda";

export type GeometryKind = "point" | "line" | "polygon";

export type GeoLayerDefinition = {
  id: string;
  title: string;
  url: string;
  category: GeoCategory;
  color: string;
  geometry: GeometryKind;
  /**
   * Optional local fallback file served from /public
   */
  fallbackUrl?: string;
  /**
   * When true the layer is fetched immediately. Otherwise it will be lazy
   * loaded on first explicit request (e.g. filter activation).
   */
  preload?: boolean;
};

export type GeoLayerState = Record<string, FeatureCollection | null>;

export type LoadingState = Record<string, boolean>;

export type ErrorState = Record<string, string | null>;

const DEFAULT_LAYERS: GeoLayerDefinition[] = [
  {
    id: "cyklo",
    title: "Cyklotrasy",
    url: "https://services6.arcgis.com/ogJAiK65nXL1mXAW/arcgis/rest/services/Cyklov%C3%BDlety/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson",
    fallbackUrl: "/data/sample-cyklotrasy.json",
    category: "cyklotrasy",
    color: "#2563eb",
    geometry: "line",
    preload: true,
  },
  {
    id: "pamatky",
    title: "Památky a historie",
    url: "/data/sample-pamatky.json",
    fallbackUrl: "/data/sample-pamatky.json",
    category: "pamatky",
    color: "#d97706",
    geometry: "point",
    preload: false,
  },
  {
    id: "priroda",
    title: "Přírodní zajímavosti",
    url: "/data/sample-priroda.json",
    fallbackUrl: "/data/sample-priroda.json",
    category: "priroda",
    color: "#16a34a",
    geometry: "polygon",
    preload: false,
  },
];

export function useGeoData(customLayers?: GeoLayerDefinition[]) {
  const layers = useMemo(
    () => customLayers ?? DEFAULT_LAYERS,
    [customLayers],
  );

  const [data, setData] = useState<GeoLayerState>({});
  const [loading, setLoading] = useState<LoadingState>({});
  const [errors, setErrors] = useState<ErrorState>({});

  const loadLayer = useCallback(
    async (layerId: string) => {
      const layer = layers.find((item) => item.id === layerId);
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
          fallbackUrl: layer.fallbackUrl,
        });
        setData((prev) => ({ ...prev, [layerId]: geojson }));
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Nepodařilo se načíst GeoJSON data.";
        setErrors((prev) => ({ ...prev, [layerId]: message }));
      } finally {
        setLoading((prev) => ({ ...prev, [layerId]: false }));
      }
    },
    [layers],
  );

  const preloadLayers = useCallback(() => {
    const preloads = layers.filter((layer) => layer.preload);
    preloads.forEach((layer) => {
      void loadLayer(layer.id);
    });
  }, [layers, loadLayer]);

  useEffect(() => {
    preloadLayers();
  }, [preloadLayers]);

  const isLoading = layers.some((layer) => loading[layer.id]);
  const firstError =
    layers.map((layer) => errors[layer.id]).find(Boolean) ?? null;

  return {
    layers,
    data,
    loading,
    isLoading,
    errors,
    error: firstError,
    loadLayer,
    reloadLayer: loadLayer,
  };
}
