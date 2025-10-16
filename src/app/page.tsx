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

type SelectedState =
  | {
      layerId: GeoLayerId;
      featureId: string;
    }
  | null;

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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
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
  const [mobilePanelTab, setMobilePanelTab] = useState<"detail" | "favorites">(
    "detail",
  );
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("khk-theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("khk-theme", theme);
  }, [theme]);

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

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24 text-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto flex max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-10 lg:py-10">
        <header className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200/90">
            Poznej Královéhradecký kraj
          </p>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl dark:text-slate-50">
            KHK Explore – interaktivní průvodce zážitky
          </h1>
          <p className="max-w-3xl text-balance text-sm text-white/80 sm:text-base dark:text-slate-300">
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
          onToggleTheme={handleToggleTheme}
          isDarkMode={theme === "dark"}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,3fr)_minmax(360px,1.2fr)]">
          <div className="flex flex-col gap-6">
            <LayerControl
              layers={layers}
              metadataByLayer={metadataByLayer}
              activeLayerSet={activeLayerSet}
              toggleLayer={toggleLayer}
              setAllLayers={setAllLayers}
            />
            <div className="relative h-[65vh] min-h-[420px] overflow-hidden rounded-3xl bg-slate-900/40 shadow-2xl sm:h-[70vh]">
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
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-white/10 bg-slate-950/90 p-5 text-white shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden"
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
              {mobilePanelTab === "detail" ? detailPanel : favoritesPanel}
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
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/80 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur dark:bg-slate-800/90 dark:text-slate-100"
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
