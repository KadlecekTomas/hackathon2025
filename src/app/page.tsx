"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Feature } from "geojson";
import dynamic from "next/dynamic";
import type { MapViewProps } from "@/components/MapView";
import { FilterPanel } from "@/components/FilterPanel";
import { DetailPanel } from "@/components/DetailPanel";
import { FavoritesPanel } from "@/components/FavoritesPanel";
import {
  loadFavorites,
  removeFavorite,
  toggleFavorite,
  type FavoriteFeature,
} from "@/utils/storageUtils";
import {
  featureCollectionToArray,
  featureToFavorite,
  getFeatureId,
} from "@/utils/featureUtils";
import { useGeoData } from "@/hooks/useGeoData";
import { useFilters } from "@/hooks/useFilters";

type SelectedState = {
  layerId: string;
  featureId: string;
};

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

export default function Home() {
  const { layers, data, loadLayer, loading } = useGeoData();
  const { activeFilters, toggleFilter, setFilters, shouldDisplayLayer } =
    useFilters();

  const [selected, setSelected] = useState<SelectedState | null>(null);
  const [favorites, setFavorites] = useState<FavoriteFeature[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    layers
      .filter((layer) => shouldDisplayLayer(layer))
      .forEach((layer) => {
        if (!data[layer.id] && !loading[layer.id]) {
          void loadLayer(layer.id);
        }
      });
  }, [layers, shouldDisplayLayer, data, loadLayer, loading]);

  useEffect(() => {
    if (!selected) return;
    const layer = layers.find((item) => item.id === selected.layerId);
    if (!layer) return;
    if (!shouldDisplayLayer(layer)) {
      setSelected(null);
    }
  }, [layers, selected, shouldDisplayLayer]);

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

  const selectedLayerTitle = useMemo(() => {
    if (!selected) return null;
    const layer = layers.find((item) => item.id === selected.layerId);
    return layer?.title ?? "Vrstva";
  }, [layers, selected]);

  const handleSelectFeature = useCallback(
    (layerId: string, feature: Feature) => {
      setSelected({
        layerId,
        featureId: getFeatureId(feature),
      });
    },
    [],
  );

  const handleToggleFavorite = useCallback(() => {
    if (!selected || !selectedFeature) return;
    const favoritePayload = featureToFavorite(
      selectedFeature,
      selected.layerId,
    );
    setFavorites((prev) => toggleFavorite(prev, favoritePayload));
  }, [selected, selectedFeature]);

  const handleSelectFavorite = useCallback(
    (favorite: FavoriteFeature) => {
      setSelected({
        layerId: favorite.layerId,
        featureId: favorite.id,
      });
      if (!data[favorite.layerId]) {
        void loadLayer(favorite.layerId);
      }
    },
    [data, loadLayer],
  );

  const handleRemoveFavorite = useCallback((favoriteId: string) => {
    setFavorites((prev) => removeFavorite(prev, favoriteId));
  }, []);

  const handleRandomTip = useCallback(() => {
    const visibleLayers = layers.filter((layer) => shouldDisplayLayer(layer));
    let available = visibleLayers.flatMap((layer) => {
      const collection = data[layer.id];
      if (!collection) {
        void loadLayer(layer.id);
        return [];
      }
      return featureCollectionToArray(collection).map((feature) => ({
        layerId: layer.id,
        feature,
      }));
    });

    if (available.length === 0) {
      const fallbackLayer = visibleLayers[0];
      if (fallbackLayer) {
        void loadLayer(fallbackLayer.id);
      }
      available = [];
    }
    if (available.length === 0) {
      return;
    }

    const randomPick =
      available[Math.floor(Math.random() * available.length)];
    handleSelectFeature(randomPick.layerId, randomPick.feature);
  }, [
    data,
    layers,
    shouldDisplayLayer,
    loadLayer,
    handleSelectFeature,
  ]);

  const isSelectedFavorite = useMemo(() => {
    if (!selected) return false;
    return favorites.some(
      (favorite) =>
        favorite.id === selected.featureId &&
        favorite.layerId === selected.layerId,
    );
  }, [favorites, selected]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto flex max-w-[120rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:px-10 lg:py-10">
        <header className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl backdrop-blur">
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
            Poznej Královéhradecký kraj
          </p>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
            KHK Explore – interaktivní průvodce zážitky
          </h1>
          <p className="max-w-3xl text-balance text-sm text-white/80 sm:text-base">
            Objevujte cyklotrasy, přírodní zajímavosti i památky
            Královéhradeckého kraje na jediné mapě. Filtrovatelné vrstvy,
            oblíbené tipy a náhled měst v okolí vám pomohou naplánovat perfektní
            výlet.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,3fr)_minmax(360px,1.2fr)]">
          <div className="flex flex-col gap-6">
            <FilterPanel
              activeFilters={activeFilters}
              toggleFilter={(filter) => {
                toggleFilter(filter);
              }}
              onRandomTip={handleRandomTip}
              onReset={() => setFilters(["vse"])}
            />
            <div className="h-[65vh] min-h-[420px] overflow-hidden rounded-3xl bg-slate-900/40 shadow-2xl sm:h-[70vh]">
              <MapView
                layers={layers}
                data={data}
                loading={loading}
                shouldDisplayLayer={shouldDisplayLayer}
                onSelectFeature={handleSelectFeature}
                selectedFeatureId={selected?.featureId ?? null}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <DetailPanel
              feature={selectedFeature}
              layerTitle={selectedLayerTitle ?? undefined}
              isFavorite={isSelectedFavorite}
              onToggleFavorite={handleToggleFavorite}
            />
            <FavoritesPanel
              favorites={favorites}
              onSelect={handleSelectFavorite}
              onRemove={handleRemoveFavorite}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
