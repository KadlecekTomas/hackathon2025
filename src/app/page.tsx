"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import type { Feature } from "geojson";
import type { MapViewProps } from "@/components/MapView";
import { FilterPanel } from "@/components/FilterPanel";
import { LayerControl } from "@/components/LayerControl";
import {
  DetailPanel,
  type RecommendationItem,
} from "@/components/DetailPanel";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import {
  loadFavorites,
  toggleFavorite,
  removeFavorite,
  type FavoriteFeature,
} from "@/utils/storageUtils";
import {
  featureCollectionToArray,
  featureToFavorite,
  getFeatureCenter,
  getFeatureDescription,
  getFeatureDistrict,
  getFeatureId,
  getFeatureRegion,
  getFeatureTitle,
  haversineDistanceKm,
} from "@/utils/featureUtils";
import {
  useGeoData,
  type GeoLayerId,
  type GeoLayerDefinition,
} from "@/hooks/useGeoData";
import { useFilters } from "@/hooks/useFilters";
import { useAISearch } from "@/hooks/useAISearch";
import { AISearchBox } from "@/components/AISearchBox";
import { AITipsPanel } from "@/components/AITipsPanel";
import { AIPlanner } from "@/components/AIPlanner";
import {
  mapFeatureToAIFeature,
  type AIFeature,
  buildFriendlySummary,
  normalizeForSearch,
  SEARCH_STOP_WORDS,
} from "@/utils/aiUtils";

type SelectedState =
  | {
      layerId: GeoLayerId;
      featureId: string;
    }
  | null;

type NormalizedLocation = {
  raw: string;
  normalized: string;
};

type QueryContext = {
  cleanedQuery: string;
  matchedDistrict: string | null;
  matchedRegion: string | null;
};

const LOCATION_PREPOSITIONS = new Set([
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

function buildNormalizedLocations(items: string[]): NormalizedLocation[] {
  return items
    .map((raw) => ({
      raw,
      normalized: normalizeForSearch(raw),
    }))
    .filter((item) => item.normalized.length > 0)
    .sort((a, b) => b.normalized.length - a.normalized.length);
}

function filterOutLocationWords(
  words: string[],
  location: NormalizedLocation | null,
): string[] {
  if (!location) return words;
  const targetTokens = location.normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  return words.filter((word) => {
    const normalized = normalizeForSearch(word);
    if (normalized.length === 0) return false;
    if (LOCATION_PREPOSITIONS.has(normalized)) return false;
    const matchesLocation = targetTokens.some((token) => {
      if (token === normalized) return true;
      const lengthDiff = Math.abs(token.length - normalized.length);
      if (lengthDiff <= 1 && token.startsWith(normalized)) {
        return true;
      }
      if (lengthDiff <= 1 && normalized.startsWith(token)) {
        return true;
      }
      return false;
    });
    if (matchesLocation) return false;
    return true;
  });
}

function removeStopWords(words: string[]): string[] {
  return words.filter((word) => {
    const normalized = normalizeForSearch(word);
    return normalized.length > 0 && !SEARCH_STOP_WORDS.has(normalized);
  });
}

function extractQueryContext(
  rawQuery: string,
  districts: NormalizedLocation[],
  regions: NormalizedLocation[],
): QueryContext {
  const normalizedQuery = normalizeForSearch(rawQuery);
  const matchedDistrict =
    districts.find((entry) => normalizedQuery.includes(entry.normalized)) ??
    null;
  const matchedRegion =
    regions.find((entry) => normalizedQuery.includes(entry.normalized)) ?? null;

  const words = rawQuery
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  let filteredWords = filterOutLocationWords(words, matchedDistrict);
  filteredWords = filterOutLocationWords(filteredWords, matchedRegion);

  const withoutStops = removeStopWords(filteredWords);
  const cleanedCandidates =
    withoutStops.length > 0 ? withoutStops : filteredWords;
  const cleanedQuery =
    cleanedCandidates.length > 0
      ? cleanedCandidates.join(" ")
      : rawQuery.trim();

  return {
    cleanedQuery: cleanedQuery.trim(),
    matchedDistrict: matchedDistrict?.raw ?? null,
    matchedRegion: matchedRegion?.raw ?? null,
  };
}

const MapView = dynamic<MapViewProps>(
  () => import("@/components/MapView").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-white/70">
        Načítám mapu…
      </div>
    ),
  },
);

function PageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    layers,
    data,
    loading,
    loadLayer,
    metadataByLayer,
    availableDistricts,
    availableRegions,
    getFeatureByLayerAndId,
  } = useGeoData();

  const normalizedDistricts = useMemo(
    () => buildNormalizedLocations(availableDistricts),
    [availableDistricts],
  );

  const normalizedRegions = useMemo(
    () => buildNormalizedLocations(availableRegions),
    [availableRegions],
  );

  const {
    activeLayerSet,
    toggleLayer,
    setAllLayers,
    locationFilter,
    setDistrictFilter,
    setRegionFilter,
    clearLocationFilters,
    shouldDisplayFeature,
  } = useFilters({ layers });

  const [selected, setSelected] = useState<SelectedState>(null);
  const [favorites, setFavorites] = useState<FavoriteFeature[]>([]);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [nearestFeature, setNearestFeature] = useState<{
    layerId: GeoLayerId;
    featureId: string;
    distance: number;
  } | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [mobilePanelTab, setMobilePanelTab] = useState<
    "detail" | "favorites" | "ai"
  >("detail");
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(
    null,
  );
  const [aiSearchResults, setAiSearchResults] = useState<AIFeature[]>([]);
  const [aiAutoTips, setAiAutoTips] = useState<AIFeature[]>([]);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    layers.forEach((layer) => {
      if (activeLayerSet.has(layer.id) && !data[layer.id] && !loading[layer.id]) {
        void loadLayer(layer.id);
      }
    });
  }, [layers, activeLayerSet, data, loadLayer, loading]);

  useEffect(() => {
    if (!selected) return;
    if (!activeLayerSet.has(selected.layerId)) {
      setSelected(null);
      return;
    }
    const collection = data[selected.layerId];
    if (!collection) return;
    const feature =
      featureCollectionToArray(collection).find(
        (item) => getFeatureId(item) === selected.featureId,
      ) ?? null;
    if (!feature) return;
    if (!shouldDisplayFeature(selected.layerId, feature)) {
      setSelected(null);
    }
  }, [selected, data, shouldDisplayFeature, activeLayerSet]);

  useEffect(() => {
    const paramId = searchParams.get("id");
    if (paramId) {
      setPendingSelectionId(paramId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!pendingSelectionId) return;
    const [layerIdRaw, featureId] = pendingSelectionId.split(":");
    if (!layerIdRaw || !featureId) {
      setPendingSelectionId(null);
      return;
    }
    const layerId = layerIdRaw as GeoLayerId;
    const layerExists = layers.some((layer) => layer.id === layerId);
    if (!layerExists) {
      setPendingSelectionId(null);
      return;
    }
    if (!data[layerId]) {
      void loadLayer(layerId);
      return;
    }
    const feature = getFeatureByLayerAndId(layerId, featureId);
    if (!feature) return;
    setSelected({ layerId, featureId });
    setPendingSelectionId(null);
  }, [
    pendingSelectionId,
    layers,
    data,
    loadLayer,
    getFeatureByLayerAndId,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (selected) {
      params.set("id", `${selected.layerId}:${selected.featureId}`);
    } else {
      params.delete("id");
    }
    const queryString = params.toString();
    router.replace(
      `${pathname}${queryString ? `?${queryString}` : ""}`,
      { scroll: false },
    );
  }, [selected, router, pathname]);

  const visibleFeatureEntries = useMemo(() => {
    const entries: Array<{
      layer: GeoLayerDefinition;
      feature: Feature;
    }> = [];
    let total = 0;
    layers.forEach((layer) => {
      const collection = data[layer.id];
      if (!collection) return;
      const features = featureCollectionToArray(collection);
      total += features.length;
      features.forEach((feature) => {
        if (shouldDisplayFeature(layer.id, feature)) {
          entries.push({ layer, feature });
        }
      });
    });
    return {
      entries,
      total,
    };
  }, [layers, data, shouldDisplayFeature]);

  useEffect(() => {
    if (!userLocation) {
      setNearestFeature(null);
      return;
    }
    const best = visibleFeatureEntries.entries.reduce<{
      layerId: GeoLayerId;
      featureId: string;
      distance: number;
    } | null>((acc, item) => {
      const center = getFeatureCenter(item.feature);
      if (!center) return acc;
      const distance = haversineDistanceKm(
        userLocation,
        { lat: center[0], lng: center[1] },
      );
      if (!acc || distance < acc.distance) {
        return {
          layerId: item.layer.id,
          featureId: getFeatureId(item.feature),
          distance,
        };
      }
      return acc;
    }, null);

    setNearestFeature(best);

    if (best && best.distance <= 10) {
      setSelected((prev) =>
        prev ?? { layerId: best.layerId, featureId: best.featureId },
      );
    }
  }, [userLocation, visibleFeatureEntries]);

  const selectedFeature = useMemo(() => {
    if (!selected) return null;
    const collection = data[selected.layerId];
    if (!collection) return null;
    return (
      featureCollectionToArray(collection).find(
        (feature) => getFeatureId(feature) === selected.featureId,
      ) ?? null
    );
  }, [data, selected]);

  const selectedLayer = useMemo(
    () => (selected ? layers.find((layer) => layer.id === selected.layerId) : null),
    [layers, selected],
  );

  const favoritesKeySet = useMemo(() => {
    return new Set(
      favorites.map((favorite) => `${favorite.layerId}:${favorite.id}`),
    );
  }, [favorites]);

  const aiFeatures = useMemo(() => {
    const items: AIFeature[] = [];
    layers.forEach((layer) => {
      const collection = data[layer.id];
      if (!collection) return;
      featureCollectionToArray(collection).forEach((feature) => {
        items.push(mapFeatureToAIFeature(layer, feature));
      });
    });
    return items;
  }, [layers, data]);

  const { search: aiSearch } = useAISearch({ features: aiFeatures });

  useEffect(() => {
    const relevant = aiFeatures.filter((item) => {
      if (!activeLayerSet.has(item.layerId as GeoLayerId)) return false;
      if (locationFilter.district && item.district !== locationFilter.district) {
        return false;
      }
      if (locationFilter.region && item.region !== locationFilter.region) {
        return false;
      }
      return true;
    });
    const topRelevant = relevant.slice(0, 3);
    setAiAutoTips(topRelevant);
    if (aiSearchResults.length === 0) {
      setAiMessage(
        topRelevant.length > 0
          ? "Tipy podle aktuálně vybraných filtrů."
          : "Zadejte, co vás zajímá, a AI vám doporučí výlet.",
      );
    }
  }, [
    aiFeatures,
    activeLayerSet,
    locationFilter.district,
    locationFilter.region,
    aiSearchResults.length,
  ]);

  const plannerFeatures = useMemo(() => aiFeatures, [aiFeatures]);

  const isFavorite = useCallback(
    (layerId: GeoLayerId, featureId: string) =>
      favoritesKeySet.has(`${layerId}:${featureId}`),
    [favoritesKeySet],
  );

  const handleSelectFeature = useCallback(
    (layerId: GeoLayerId, feature: Feature) => {
      const id = getFeatureId(feature);
      setSelected({ layerId, featureId: id });
      if (window.innerWidth < 1024) {
        setMobilePanelOpen(true);
        setMobilePanelTab("detail");
      }
    },
    [],
  );

  const handleToggleFavorite = useCallback(
    (layerId: GeoLayerId, feature: Feature) => {
      const layer = layers.find((item) => item.id === layerId);
      if (!layer) return;
      const favoritePayload = featureToFavorite(feature, layerId, layer.title);
      setFavorites((prev) => toggleFavorite(prev, favoritePayload));
      setShareMessage(
        favoritesKeySet.has(`${layerId}:${getFeatureId(feature)}`)
          ? "Tip odebrán z oblíbených."
          : "Tip uložen mezi oblíbené!",
      );
    },
    [layers, favoritesKeySet],
  );

  const handleToggleFavoriteFromDetail = useCallback(() => {
    if (!selected || !selectedFeature) return;
    handleToggleFavorite(selected.layerId, selectedFeature);
  }, [selected, selectedFeature, handleToggleFavorite]);

  const handleSelectFavorite = useCallback(
    (favorite: FavoriteFeature) => {
      setSelected({ layerId: favorite.layerId as GeoLayerId, featureId: favorite.id });
      if (!data[favorite.layerId as GeoLayerId]) {
        void loadLayer(favorite.layerId as GeoLayerId);
      }
      if (window.innerWidth < 1024) {
        setMobilePanelOpen(true);
        setMobilePanelTab("detail");
      }
    },
    [data, loadLayer],
  );

  const handleRemoveFavorite = useCallback((favorite: FavoriteFeature) => {
    setFavorites((prev) =>
      removeFavorite(prev, favorite.id, favorite.layerId),
    );
  }, []);

  const handleRandomTip = useCallback(() => {
    if (visibleFeatureEntries.entries.length === 0) {
      const layerToLoad = layers.find(
        (layer) => activeLayerSet.has(layer.id) && !data[layer.id],
      );
      if (layerToLoad) {
        void loadLayer(layerToLoad.id);
      }
      setShareMessage("Nejdříve načtěte vrstvu nebo upravte filtr.");
      return;
    }
    const randomPick =
      visibleFeatureEntries.entries[
        Math.floor(Math.random() * visibleFeatureEntries.entries.length)
      ];
    handleSelectFeature(randomPick.layer.id, randomPick.feature);
    setShareMessage("Máme pro vás nový tip na výlet!");
  }, [
    visibleFeatureEntries.entries,
    layers,
    activeLayerSet,
    data,
    loadLayer,
    handleSelectFeature,
  ]);

  const handleAISearchQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        setAiSearchResults([]);
        setAiMessage("Napište, co vás zajímá, a AI doporučí výlet.");
        return [];
      }

      const context = extractQueryContext(
        trimmed,
        normalizedDistricts,
        normalizedRegions,
      );
      const searchQuery =
        context.cleanedQuery.length > 0 ? context.cleanedQuery : trimmed;

      setAiLoading(true);
      const results = aiSearch(searchQuery);
      await new Promise((resolve) => setTimeout(resolve, 320));

      const normalizedDistrict = context.matchedDistrict
        ? normalizeForSearch(context.matchedDistrict)
        : null;
      const normalizedRegion = context.matchedRegion
        ? normalizeForSearch(context.matchedRegion)
        : null;

      let filteredResults = results;
      if (normalizedDistrict || normalizedRegion) {
        filteredResults = results.filter((item) => {
          const itemDistrict = item.district
            ? normalizeForSearch(item.district)
            : "";
          const itemRegion = item.region
            ? normalizeForSearch(item.region)
            : "";
          const districtMatch =
            !normalizedDistrict ||
            (itemDistrict && itemDistrict.includes(normalizedDistrict));
          const regionMatch =
            !normalizedRegion ||
            (itemRegion && itemRegion.includes(normalizedRegion));
          return districtMatch && regionMatch;
        });
        if (filteredResults.length === 0) {
          filteredResults = results;
        }
      }

      const limitedResults = filteredResults.slice(0, 3);
      setAiSearchResults(limitedResults);

      const locationParts: string[] = [];
      if (context.matchedDistrict) {
        locationParts.push(`okres ${context.matchedDistrict}`);
      }
      if (context.matchedRegion) {
        locationParts.push(context.matchedRegion);
      }

      if (limitedResults.length === 0) {
        setAiMessage(
          locationParts.length > 0
            ? `Bohužel jsem pro ${locationParts.join(
                " a ",
              )} nenašla odpovídající výlet. Zkuste dotaz upravit nebo zvolit jinou oblast.`
            : "Bohužel jsem nenašla odpovídající výlet. Zkuste zadání upřesnit.",
        );
      } else {
        setAiMessage(
          locationParts.length > 0
            ? `Tipy připravené pro ${locationParts.join(" a ")}.`
            : "Našla jsem tipy, které by se vám mohly líbit.",
        );
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setMobilePanelOpen(true);
          setMobilePanelTab("ai");
        }
      }

      setAiLoading(false);
      return limitedResults;
    },
    [aiSearch, normalizedDistricts, normalizedRegions],
  );

  const handleAISuggestionSelect = useCallback(
    (item: AIFeature) => {
      if (!data[item.layerId as GeoLayerId]) {
        void loadLayer(item.layerId as GeoLayerId);
      }
      setShareMessage(buildFriendlySummary(item));
      handleSelectFeature(item.layerId as GeoLayerId, item.feature);
    },
    [data, loadLayer, handleSelectFeature],
  );

  const handleLocate = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoMessage("Geolokaci váš prohlížeč nepodporuje.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setGeoMessage("Vaše poloha byla určena.");
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        setGeoMessage("Geolokaci se nepodařilo získat.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const handleShare = useCallback(() => {
    if (!selected) {
      setShareMessage("Vyberte nejprve lokalitu k sdílení.");
      return;
    }
    const shareUrl = `${window.location.origin}${pathname}?id=${selected.layerId}:${selected.featureId}`;
    if (navigator.share) {
      navigator
        .share({
          title: "KHK Explore",
          text: "Podívej se na tenhle tip na výlet!",
          url: shareUrl,
        })
        .catch(() => {
          /* noop */
        });
      return;
    }
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => setShareMessage("Odkaz zkopírován do schránky."))
      .catch(() => setShareMessage("Odkaz se nepodařilo zkopírovat."));
  }, [selected, pathname]);

  const handleExportPdf = useCallback(() => {
    if (!selected || !selectedFeature || !selectedLayer) {
      setShareMessage("Vyberte lokalitu pro export PDF.");
      return;
    }
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KHK Explore – turistický tip", 12, 20);
    doc.setFontSize(14);
    doc.text(getFeatureTitle(selectedFeature), 12, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Kategorie: ${selectedLayer.title}`, 12, 42);
    const district = getFeatureDistrict(selectedFeature);
    const region = getFeatureRegion(selectedFeature);
    if (district) doc.text(`Okres: ${district}`, 12, 50);
    if (region) doc.text(`Region: ${region}`, 12, 58);
    const description = getFeatureDescription(selectedFeature);
    const descriptionLines = doc.splitTextToSize(description, 180);
    doc.text("Popis trasy:", 12, 70);
    doc.text(descriptionLines, 12, 78);
    doc.text(
      `Odkaz: ${window.location.origin}${pathname}?id=${selected.layerId}:${selected.featureId}`,
      12,
      110,
    );
    doc.save(
      `khk-explore-${getFeatureId(selectedFeature).slice(0, 8)}.pdf`,
    );
    setShareMessage("PDF bylo staženo do vašeho zařízení.");
  }, [selected, selectedFeature, selectedLayer, pathname]);

  useEffect(() => {
    if (!shareMessage) return;
    const timeout = window.setTimeout(() => setShareMessage(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [shareMessage]);

  const nearestFeatureData = useMemo(() => {
    if (!nearestFeature) return null;
    return getFeatureByLayerAndId(nearestFeature.layerId, nearestFeature.featureId);
  }, [nearestFeature, getFeatureByLayerAndId]);

  const nearestInfo = useMemo(() => {
    if (geoMessage) return geoMessage;
    if (!userLocation) return null;
    if (!nearestFeature || !nearestFeatureData) {
      return "Žádné tipy v okolí zatím neznáme.";
    }
    const title = getFeatureTitle(nearestFeatureData);
    const distance = nearestFeature.distance;
    if (distance <= 10) {
      return `${title} (${distance.toFixed(1)} km)`;
    }
    return `${title} je vzdáleno ${distance.toFixed(1)} km (mimo 10 km)`;
  }, [geoMessage, userLocation, nearestFeature, nearestFeatureData]);

  const recommendations: RecommendationItem[] = useMemo(() => {
    if (!selected || !selectedFeature) return [];
    const selectedDistrict = getFeatureDistrict(selectedFeature);
    const selectedCenter = getFeatureCenter(selectedFeature);
    const related = visibleFeatureEntries.entries.filter(
      (entry) =>
        entry.layer.id === selected.layerId &&
        getFeatureId(entry.feature) !== selected.featureId,
    );
    const sorted = related
      .map((entry) => {
        const district = getFeatureDistrict(entry.feature);
        const center = getFeatureCenter(entry.feature);
        const distance =
          selectedCenter && center
            ? haversineDistanceKm(
                { lat: selectedCenter[0], lng: selectedCenter[1] },
                { lat: center[0], lng: center[1] },
              )
            : null;
        const districtMatch =
          selectedDistrict && district
            ? district.localeCompare(selectedDistrict, "cs", {
                sensitivity: "accent",
              }) === 0
            : false;
        return {
          id: getFeatureId(entry.feature),
          layerId: entry.layer.id,
          layerTitle: entry.layer.title,
          title: getFeatureTitle(entry.feature),
          district,
          distanceKm: distance,
          districtMatch,
        };
      })
      .sort((a, b) => {
        if (a.districtMatch && !b.districtMatch) return -1;
        if (!a.districtMatch && b.districtMatch) return 1;
        if (a.distanceKm && b.distanceKm) return a.distanceKm - b.distanceKm;
        return a.title.localeCompare(b.title, "cs");
      });
    return sorted.slice(0, 3);
  }, [selected, selectedFeature, visibleFeatureEntries.entries]);

  const displayedAITips =
    aiSearchResults.length > 0 ? aiSearchResults : aiAutoTips;

  const detailPanel = (
    <DetailPanel
      feature={selectedFeature}
      layerTitle={selectedLayer?.title}
      layerColor={selectedLayer?.color}
      isFavorite={selected ? isFavorite(selected.layerId, selected.featureId) : false}
      onToggleFavorite={handleToggleFavoriteFromDetail}
      onShare={handleShare}
      onExportPdf={handleExportPdf}
      recommendations={recommendations}
      onSelectRecommendation={(layerId, featureId) =>
        setSelected({ layerId: layerId as GeoLayerId, featureId })
      }
      nearestDistance={
        selected &&
        nearestFeature &&
        selected.layerId === nearestFeature.layerId &&
        selected.featureId === nearestFeature.featureId
          ? nearestFeature.distance
          : null
      }
    />
  );

  const favoritesPanel = (
    <FavoritesPanel
      favorites={favorites}
      onSelect={handleSelectFavorite}
      onRemove={handleRemoveFavorite}
    />
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 pb-24 text-slate-900">
      <div className="mx-auto flex max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-10 lg:py-10">
        <header className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Poznej Královéhradecký kraj
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            KHK Explore – interaktivní průvodce zážitky
          </h1>
          <p className="max-w-3xl text-balance text-sm text-slate-600 sm:text-base">
            Objevujte židovské a církevní památky, přírodní zajímavosti i turistické
            regiony Královéhradeckého kraje. Vrstvy, filtry, oblíbené tipy a náhodná
            doporučení vám pomohou naplánovat perfektní výlet.
          </p>
        </header>

        <FilterPanel
          availableDistricts={availableDistricts}
          availableRegions={availableRegions}
          selectedDistrict={locationFilter.district}
          selectedRegion={locationFilter.region}
          onDistrictChange={setDistrictFilter}
          onRegionChange={setRegionFilter}
          onClearFilters={() => {
            clearLocationFilters();
            setShareMessage("Filtry byly obnoveny.");
          }}
          onRandomTip={handleRandomTip}
          onLocate={handleLocate}
          locating={isLocating}
          nearestInfo={nearestInfo}
          visibleCount={visibleFeatureEntries.entries.length}
          totalCount={visibleFeatureEntries.total}
          favoritesCount={favorites.length}
          activeLayerCount={activeLayerSet.size}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,3fr)_minmax(360px,1.2fr)]">
          <div className="flex flex-col gap-6">
            <AISearchBox
              onSearch={handleAISearchQuery}
              onSelect={handleAISuggestionSelect}
            />
            <LayerControl
              layers={layers}
              metadataByLayer={metadataByLayer}
              activeLayerSet={activeLayerSet}
              toggleLayer={toggleLayer}
              setAllLayers={setAllLayers}
            />
            <div className="relative h-[65vh] min-h-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl sm:h-[70vh]">
              <MapView
                layers={layers}
                data={data}
                loading={loading}
                activeLayerSet={activeLayerSet}
                shouldDisplayFeature={shouldDisplayFeature}
                onSelectFeature={handleSelectFeature}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={isFavorite}
                selected={selected}
                userLocation={userLocation}
                nearestFeatureId={
                  nearestFeature
                    ? {
                        layerId: nearestFeature.layerId,
                        featureId: nearestFeature.featureId,
                      }
                    : null
                }
              />
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-6">
            {detailPanel}
            <AIPlanner
              features={plannerFeatures}
              onSelect={handleAISuggestionSelect}
            />
            <AITipsPanel
              tips={displayedAITips}
              onSelect={handleAISuggestionSelect}
              isLoading={aiLoading}
              message={aiMessage}
            />
            {favoritesPanel}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobilePanelOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-slate-200 bg-white p-5 text-slate-900 shadow-2xl lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobilePanelTab("detail")}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                    mobilePanelTab === "detail"
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-white/10 text-white",
                  ].join(" ")}
                >
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePanelTab("favorites")}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                    mobilePanelTab === "favorites"
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-white/10 text-white",
                  ].join(" ")}
                >
                  Oblíbené
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePanelTab("ai")}
                  className={[
                    "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition",
                    mobilePanelTab === "ai"
                      ? "bg-emerald-500 text-emerald-950"
                      : "bg-white/10 text-white",
                  ].join(" ")}
                >
                  AI průvodce
                </button>
              </div>
              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80"
              >
                Zavřít
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto">
              {mobilePanelTab === "detail" ? (
                detailPanel
              ) : mobilePanelTab === "favorites" ? (
                favoritesPanel
              ) : (
                <div className="space-y-4">
                  <AIPlanner
                    features={plannerFeatures}
                    onSelect={handleAISuggestionSelect}
                  />
                  <AITipsPanel
                    tips={displayedAITips}
                    onSelect={handleAISuggestionSelect}
                    isLoading={aiLoading}
                    message={aiMessage}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {shareMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-lg backdrop-blur"
          >
            {shareMessage}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}
