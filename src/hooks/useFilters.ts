"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Feature } from "geojson";
import {
  getFeatureDistrict,
  getFeatureRegion,
} from "@/utils/featureUtils";
import type { GeoLayerDefinition, GeoLayerId } from "@/hooks/useGeoData";

export type LocationFilter = {
  district: string | null;
  region: string | null;
};

type UseFiltersArgs = {
  layers: GeoLayerDefinition[];
};

const INITIALLY_DISABLED_LAYERS: GeoLayerId[] = ["turisticke-regiony"];

export function useFilters({ layers }: UseFiltersArgs) {
  const [activeLayerIds, setActiveLayerIds] = useState<GeoLayerId[]>(() =>
    layers
      .filter((layer) => !INITIALLY_DISABLED_LAYERS.includes(layer.id))
      .map((layer) => layer.id),
  );
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({
    district: null,
    region: null,
  });

  useEffect(() => {
    setActiveLayerIds((prev) => {
      const current = new Set(prev);
      let changed = false;

      // add new layers that are not disabled by default
      layers.forEach((layer) => {
        if (!current.has(layer.id)) {
          if (!INITIALLY_DISABLED_LAYERS.includes(layer.id)) {
            current.add(layer.id);
            changed = true;
          }
        }
      });

      // remove layers that no longer exist
      const availableLayerIds = new Set(layers.map((layer) => layer.id));
      current.forEach((layerId) => {
        if (!availableLayerIds.has(layerId)) {
          current.delete(layerId);
          changed = true;
        }
      });

      return changed ? Array.from(current) : prev;
    });
  }, [layers]);

  const isLayerActive = useCallback(
    (layerId: GeoLayerId) => activeLayerIds.includes(layerId),
    [activeLayerIds],
  );

  const toggleLayer = useCallback((layerId: GeoLayerId) => {
    setActiveLayerIds((prev) => {
      const hasLayer = prev.includes(layerId);
      if (hasLayer) {
        return prev.filter((id) => id !== layerId);
      }
      return [...prev, layerId];
    });
  }, []);

  const setAllLayers = useCallback((enabled: boolean) => {
    if (enabled) {
      setActiveLayerIds(layers.map((layer) => layer.id));
    } else {
      setActiveLayerIds([]);
    }
  }, [layers]);

  const clearLocationFilters = useCallback(() => {
    setLocationFilter({ district: null, region: null });
  }, []);

  const setDistrictFilter = useCallback((district: string | null) => {
    setLocationFilter((prev) => ({
      ...prev,
      district: district && district.trim().length > 0 ? district : null,
    }));
  }, []);

  const setRegionFilter = useCallback((region: string | null) => {
    setLocationFilter((prev) => ({
      ...prev,
      region: region && region.trim().length > 0 ? region : null,
    }));
  }, []);

  const shouldDisplayFeature = useCallback(
    (layerId: GeoLayerId, feature: Feature) => {
      if (!isLayerActive(layerId)) return false;
      if (!locationFilter.district && !locationFilter.region) return true;

      const district = getFeatureDistrict(feature);
      if (
        locationFilter.district &&
        (!district ||
          district.localeCompare(locationFilter.district, "cs", {
            sensitivity: "accent",
          }) !== 0)
      ) {
        return false;
      }

      const region = getFeatureRegion(feature);
      if (
        locationFilter.region &&
        (!region ||
          region.localeCompare(locationFilter.region, "cs", {
            sensitivity: "accent",
          }) !== 0)
      ) {
        return false;
      }

      return true;
    },
    [isLayerActive, locationFilter.district, locationFilter.region],
  );

  const shouldDisplayLayer = useCallback(
    (layer: GeoLayerDefinition) => {
      if (!isLayerActive(layer.id)) return false;
      if (!locationFilter.district && !locationFilter.region) return true;
      return true;
    },
    [isLayerActive, locationFilter.district, locationFilter.region],
  );

  const activeLayerSet = useMemo(() => new Set(activeLayerIds), [activeLayerIds]);

  return {
    activeLayerIds,
    activeLayerSet,
    isLayerActive,
    toggleLayer,
    setAllLayers,
    locationFilter,
    setDistrictFilter,
    setRegionFilter,
    clearLocationFilters,
    shouldDisplayFeature,
    shouldDisplayLayer,
  };
}
