"use client";

import { useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  ZoomControl,
  CircleMarker,
} from "react-leaflet";
import L, {
  type DivIcon,
  type GeoJSON as LeafletGeoJson,
  type LatLngExpression,
  type Map as LeafletMap,
  type Polyline,
} from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import type { LucideIcon } from "lucide-react";
import { Bike, Church, Map as MapIcon, TreePine, LocateIcon } from "lucide-react";
import type {
  GeoLayerDefinition,
  GeoLayerId,
  GeoLayerState,
  LoadingState,
} from "@/hooks/useGeoData";
import {
  featureCollectionToArray,
  getFeatureDescription,
  getFeatureId,
  getFeatureTitle,
} from "@/utils/featureUtils";
import { StarOfDavidIcon } from "@/components/icons/customIcons";

const DEFAULT_CENTER: [number, number] = [50.2605, 15.8336];
const DEFAULT_ZOOM = 9;

type SelectedRef =
  | {
    layerId: GeoLayerId;
    featureId: string;
  }
  | null;

export type MapViewProps = {
  layers: GeoLayerDefinition[];
  data: GeoLayerState;
  loading: LoadingState;
  activeLayerSet: Set<GeoLayerId>;
  shouldDisplayFeature: (layerId: GeoLayerId, feature: Feature) => boolean;
  onSelectFeature: (layerId: GeoLayerId, feature: Feature) => void;
  onToggleFavorite: (layerId: GeoLayerId, feature: Feature) => void;
  isFavorite: (layerId: GeoLayerId, featureId: string) => boolean;
  selected: SelectedRef;
  userLocation: { lat: number; lng: number } | null;
  nearestFeatureId: SelectedRef;
};

type IconRegistryKey = "star-of-david" | "church" | "tree" | "map" | "bike";

const iconRegistry: Record<IconRegistryKey, LucideIcon> = {
  "star-of-david": StarOfDavidIcon,
  church: Church,
  tree: TreePine,
  map: MapIcon,
  bike: Bike,
};

function buildMarkerIcon(
  layer: GeoLayerDefinition,
  { isSelected, isFavorite }: { isSelected: boolean; isFavorite: boolean },
): DivIcon {
  const IconComponent =
    iconRegistry[(layer.icon as IconRegistryKey) || "map"] ?? MapIcon;
  const svg = renderToStaticMarkup(
    <IconComponent size={22} strokeWidth={1.75} />,
  );
  const classes = ["khk-marker"];
  if (isSelected) classes.push("khk-marker--selected");
  if (isFavorite) classes.push("khk-marker--favorite");
  const html = `
    <div class="${classes.join(" ")}" style="--marker-color: ${layer.color}">
      <span class="khk-marker__icon">${svg}</span>
    </div>
  `;
  return L.divIcon({
    className: "",
    html,
    iconSize: [40, 40],
    iconAnchor: [20, 36],
    popupAnchor: [0, -32],
  });
}

function FeatureFocus({
  target,
  map,
}: {
  target: { layerId: GeoLayerId; feature: Feature } | null;
  map: LeafletMap | null;
}) {
  useEffect(() => {
    if (!map || !target) return;
    const geoJsonLayer = L.geoJSON(target.feature);
    const bounds = geoJsonLayer.getBounds();
    if (bounds && bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 13, duration: 1.2 });
    } else {
      const geom = target.feature.geometry;
      if (geom && geom.type === "Point") {
        const [lng, lat] = geom.coordinates as [number, number];
        map.flyTo([lat, lng], 13, { duration: 1.1 });
      }
    }
  }, [map, target]);

  return null;
}

function MapAccessor({
  focusTarget,
  userLocation,
}: {
  focusTarget: { layerId: GeoLayerId; feature: Feature } | null;
  userLocation: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !userLocation) return;
    map.setView([userLocation.lat, userLocation.lng], 11);
  }, [map, userLocation]);

  return <FeatureFocus map={map} target={focusTarget} />;
}

function getPopupContent(
  layer: GeoLayerDefinition,
  feature: Feature,
  compoundId: string,
) {
  const title = getFeatureTitle(feature);
  const description = getFeatureDescription(feature);
  const IconComponent =
    iconRegistry[(layer.icon as IconRegistryKey) || "map"] ?? MapIcon;
  const layerIconMarkup = renderToStaticMarkup(
    <IconComponent size={16} strokeWidth={1.5} />,
  );

  return `
    <div class="space-y-3 khk-popup-content">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold" style="color:${layer.color}">
            ${layerIconMarkup}
          </span>
          <span class="text-xs uppercase tracking-wide text-slate-500">${layer.title}</span>
        </div>
        <button
          type="button"
          class="khk-popup-close ml-auto"
          data-action="close"
          data-feature="${compoundId}"
          aria-label="Zavrit"
        >
          &times;
        </button>
      </div>
      <h3 class="font-semibold text-base text-slate-900 leading-tight">${title}</h3>
      <p class="text-sm text-slate-600 leading-relaxed">${description}</p>
      <div class="grid gap-2">
        <button
          class="khk-popup-button"
          data-action="favorite"
          data-feature="${compoundId}"
        >
          Ulozit
        </button>
      </div>
    </div>
  `;
}

export function MapView({
  layers,
  data,
  loading,
  activeLayerSet,
  shouldDisplayFeature,
  onSelectFeature,
  onToggleFavorite,
  isFavorite,
  selected,
  userLocation,
  nearestFeatureId,
}: MapViewProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const selectedFeature = useMemo(() => {
    if (!selected) return null;
    const collection = data[selected.layerId];
    if (!collection) return null;
    const feature =
      featureCollectionToArray(collection).find(
        (item) => getFeatureId(item) === selected.featureId,
      ) ?? null;
    if (!feature) return null;
    return {
      layerId: selected.layerId,
      feature,
    };
  }, [data, selected]);

  const focusTarget = useMemo(() => {
    if (selectedFeature) return selectedFeature;
    if (nearestFeatureId) {
      const collection = data[nearestFeatureId.layerId];
      if (!collection) return null;
      const match =
        featureCollectionToArray(collection).find(
          (item) => getFeatureId(item) === nearestFeatureId.featureId,
        ) ?? null;
      return match
        ? { layerId: nearestFeatureId.layerId, feature: match }
        : null;
    }
    return null;
  }, [data, nearestFeatureId, selectedFeature]);

  const overlayMessage = useMemo(() => {
    const activeLayers = layers.filter((layer) => activeLayerSet.has(layer.id));
    if (activeLayers.length === 0) {
      return "Zapněte alespoň jednu vrstvu pro zobrazení dat.";
    }
    const busy = activeLayers.some((layer) => loading[layer.id]);
    if (busy) return "Načítám data z ArcGIS…";
    const hasData = activeLayers.some((layer) => {
      const collection = data[layer.id];
      if (!collection) return false;
      return featureCollectionToArray(collection).some((feature) =>
        shouldDisplayFeature(layer.id, feature),
      );
    });
    if (!hasData) {
      return "Žádné lokality neodpovídají zvolenému filtru.";
    }
    return null;
  }, [activeLayerSet, data, layers, loading, shouldDisplayFeature]);

  const favoritesCache = useMemo(() => {
    const cache = new Set<string>();
    layers.forEach((layer) => {
      const collection = data[layer.id];
      if (!collection) return;
      featureCollectionToArray(collection).forEach((feature) => {
        const featureId = getFeatureId(feature);
        if (isFavorite(layer.id, featureId)) {
          cache.add(`${layer.id}:${featureId}`);
        }
      });
    });
    return cache;
  }, [data, isFavorite, layers]);

  const userPoint: LatLngExpression | null = userLocation
    ? [userLocation.lat, userLocation.lng]
    : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20 dark:border-slate-700">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {layers.map((layer) => {
          if (!activeLayerSet.has(layer.id)) return null;
          const collection = data[layer.id];
          if (!collection) return null;
          const filteredFeatures = featureCollectionToArray(collection).filter(
            (feature) => shouldDisplayFeature(layer.id, feature),
          );
          if (filteredFeatures.length === 0) return null;

          const filteredCollection: FeatureCollection = {
            type: "FeatureCollection",
            features: filteredFeatures,
          };

          return (
            <GeoJSON
              key={layer.id}
              data={filteredCollection}
              style={(feature) => {
                const typed = feature as Feature;
                const featureId = getFeatureId(typed);
                const isSelected =
                  selected?.layerId === layer.id &&
                  selected.featureId === featureId;
                const isHovered = hovered === `${layer.id}:${featureId}`;
                const baseWeight = layer.style?.weight ?? 2;
                const isLine = layer.geometry === "line";
                const isPolygon =
                  layer.geometry === "polygon" || layer.geometry === "mixed";

                return {
                  color: layer.color,
                  weight: isSelected ? baseWeight + 2 : isHovered ? baseWeight + 1 : baseWeight,
                  opacity: isSelected || isHovered ? 1 : 0.85,
                  dashArray: isLine ? layer.style?.dashArray ?? "4 8" : undefined,
                  fillOpacity: isPolygon
                    ? isSelected
                      ? 0.45
                      : isHovered
                        ? (layer.style?.fillOpacity ?? 0.25) + 0.1
                        : layer.style?.fillOpacity ?? 0.2
                    : 0,
                };
              }}
              pointToLayer={(feature, latlng) => {
                const typed = feature as Feature;
                const featureId = getFeatureId(typed);
                const isSelected =
                  selected?.layerId === layer.id &&
                  selected.featureId === featureId;
                const compoundId = `${layer.id}:${featureId}`;
                const markerIcon = buildMarkerIcon(layer, {
                  isSelected,
                  isFavorite: favoritesCache.has(compoundId),
                });
                return L.marker(latlng, { icon: markerIcon });
              }}
              onEachFeature={(feature, leafletLayer) => {
                const typed = feature as Feature;
                const featureId = getFeatureId(typed);
                const compoundId = `${layer.id}:${featureId}`;
                let interactionBuffer: Polyline | null = null;

                const handleClick = () => {
                  onSelectFeature(layer.id, typed);
                };

                const handleMouseOver = () => {
                  setHovered(compoundId);
                  if (
                    (leafletLayer as LeafletGeoJson).setStyle &&
                    layer.geometry !== "point"
                  ) {
                    (leafletLayer as LeafletGeoJson).setStyle({
                      weight: (layer.style?.weight ?? 2) + 1.5,
                      opacity: 1,
                    });
                  }
                };

                const handleMouseOut = () => {
                  setHovered((prev) => (prev === compoundId ? null : prev));
                  if (
                    (leafletLayer as LeafletGeoJson).setStyle &&
                    layer.geometry !== "point"
                  ) {
                    (leafletLayer as LeafletGeoJson).setStyle({
                      weight: layer.style?.weight ?? 2,
                      opacity: 0.85,
                    });
                  }
                };

                leafletLayer.on({
                  click: handleClick,
                  mouseover: handleMouseOver,
                  mouseout: handleMouseOut,
                });

                const detachInteractionBuffer = () => {
                  if (interactionBuffer) {
                    interactionBuffer.remove();
                    interactionBuffer = null;
                  }
                };

                if (layer.geometry === "line") {
                  const attachInteractionBuffer = (mapInstance: LeafletMap) => {
                    const polylineLayer = leafletLayer as Polyline;
                    const latLngs = polylineLayer.getLatLngs() as
                      | LatLngExpression[]
                      | LatLngExpression[][];

                    if (!latLngs || latLngs.length === 0) return;

                    detachInteractionBuffer();

                    interactionBuffer = L.polyline(latLngs, {
                      color: layer.color,
                      weight: (layer.style?.weight ?? 2) + 14,
                      opacity: 0.001,
                      interactive: true,
                      dashArray: undefined,
                      bubblingMouseEvents: true,
                      pane: polylineLayer.options.pane,
                      smoothFactor: polylineLayer.options.smoothFactor,
                    }).addTo(mapInstance);

                    interactionBuffer.on({
                      click: handleClick,
                      mouseover: handleMouseOver,
                      mouseout: handleMouseOut,
                    });
                  };

                  // 💎 typově čistý přístup
                  type LayerWithMap = L.Layer & { _map?: L.Map | null };

                  leafletLayer.on("add", (event) => {
                    const target = event.target as LayerWithMap;
                    const mapInstance = target._map;
                    if (mapInstance) attachInteractionBuffer(mapInstance);
                  });

                  leafletLayer.on("remove", detachInteractionBuffer);
                } else {
                  leafletLayer.on("remove", detachInteractionBuffer);
                }

                leafletLayer.bindPopup(
                  getPopupContent(layer, typed, compoundId),
                  {
                    className: "khk-popup",
                    maxWidth: 320,
                  },
                );

                leafletLayer.on("popupopen", () => {
                  const favoriteButton = document.querySelector(
                    `.khk-popup button[data-feature="${compoundId}"][data-action="favorite"]`,
                  ) as HTMLButtonElement | null;
                  const closeButton = document.querySelector(
                    `.khk-popup button[data-feature="${compoundId}"][data-action="close"]`,
                  ) as HTMLButtonElement | null;

                  if (favoriteButton) {
                    favoriteButton.textContent = isFavorite(layer.id, featureId)
                      ? "Odebrat z oblibenych"
                      : "Ulozit";
                    favoriteButton.onclick = (event) => {
                      event.stopPropagation();
                      onToggleFavorite(layer.id, typed);
                      setTimeout(() => {
                        if (favoriteButton) {
                          favoriteButton.textContent = isFavorite(layer.id, featureId)
                            ? "Odebrat z oblibenych"
                            : "Ulozit";
                        }
                      }, 150);
                    };
                  }

                  if (closeButton) {
                    closeButton.onclick = (event) => {
                      event.stopPropagation();
                      leafletLayer.closePopup();
                    };
                  }
                });
              }}
            />
          );
        })}

        {userPoint ? (
          <CircleMarker
            center={userPoint}
            radius={10}
            pathOptions={{
              color: "#38bdf8",
              weight: 3,
              fillColor: "#38bdf8",
              fillOpacity: 0.4,
            }}
          />
        ) : null}

        <MapAccessor focusTarget={focusTarget} userLocation={userLocation} />
      </MapContainer>

      {overlayMessage ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40 text-center text-sm font-medium text-white backdrop-blur">
          {overlayMessage}
        </div>
      ) : null}

      <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200 shadow-lg backdrop-blur dark:bg-slate-900/80">
        <LocateIcon size={16} />
        <span>Interaktivní mapa KHK Explore</span>
      </div>
    </div>
  );
}
