"use client";

import { useCallback, useMemo, useState } from "react";
import type { GeoLayerDefinition, GeoCategory } from "@/hooks/useGeoData";

export type FilterKey = GeoCategory | "vse";

const DEFAULT_FILTERS: FilterKey[] = ["vse"];

export function useFilters(initialFilters: FilterKey[] = DEFAULT_FILTERS) {
  const [activeFilters, setActiveFilters] =
    useState<FilterKey[]>(initialFilters);

  const toggleFilter = useCallback((filter: FilterKey) => {
    setActiveFilters((prev) => {
      const hasFilter = prev.includes(filter);
      if (filter === "vse") {
        return ["vse"];
      }
      const nextFilters = hasFilter
        ? prev.filter((item) => item !== filter)
        : [...prev.filter((item) => item !== "vse"), filter];
      return nextFilters.length === 0 ? ["vse"] : nextFilters;
    });
  }, []);

  const activateFilters = useCallback((filters: FilterKey[]) => {
    if (filters.length === 0) {
      setActiveFilters(["vse"]);
      return;
    }
    setActiveFilters(filters);
  }, []);

  const isActive = useCallback(
    (filter: FilterKey) => activeFilters.includes(filter),
    [activeFilters],
  );

  const shouldDisplayLayer = useCallback(
    (layer: GeoLayerDefinition) => {
      if (activeFilters.includes("vse")) return true;
      return activeFilters.includes(layer.category);
    },
    [activeFilters],
  );

  const activeCategories = useMemo(() => {
    if (activeFilters.includes("vse")) {
      return new Set<GeoCategory>(["cyklotrasy", "pamatky", "priroda"]);
    }
    return new Set(
      activeFilters.filter((filter): filter is GeoCategory => filter !== "vse"),
    );
  }, [activeFilters]);

  return {
    activeFilters,
    activeCategories,
    isActive,
    toggleFilter,
    setFilters: activateFilters,
    shouldDisplayLayer,
  };
}
