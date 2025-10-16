"use client";

import { useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection } from "geojson";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L, { type LeafletMouseEvent, type Map as LeafletMap } from "leaflet";
import type {
  GeoLayerDefinition,
  GeoLayerState,
  LoadingState,
} from "@/hooks/useGeoData";
import {
  featureCollectionToArray,
  getFeatureDescription,
  getFeatureId,
  getFeatureLength,
  getFeatureTitle,
  getFeatureWebsite,
} from "@/utils/featureUtils";

export type MapViewProps = {
  layers: GeoLayerDefinition[];
  data: GeoLayerState;
  loading: LoadingState;
  shouldDisplayLayer: (layer: GeoLayerDefinition) => boolean;
  onSelectFeature: (layerId: string, feature: Feature) => void;
  selectedFeatureId: string | null;
};

const DEFAULT_CENTER: [number, number] = [50.2605, 15.8336];
const DEFAULT_ZOOM = 9;

function FeatureFocus({
  feature,
  map,
}: {
  feature: Feature | null;
  map: LeafletMap | null;
}) {
  useEffect(() => {
    if (!map || !feature) return;
    const geoJsonLayer = L.geoJSON(feature);
    const bounds = geoJsonLayer.getBounds();
    if (bounds && bounds.isValid()) {
      map.flyToBounds(bounds, { padding: [32, 32], maxZoom: 13 });
    }
  }, [map, feature]);

  return null;
}

function MapAccessor({
  selectedFeature,
}: {
  selectedFeature: Feature | null;
}) {
  const map = useMap();
  return <FeatureFocus feature={selectedFeature} map={map} />;
}

function getPopupContent(feature: Feature) {
  const title = getFeatureTitle(feature);
  const description = getFeatureDescription(feature);
  const length = getFeatureLength(feature);
  const website = getFeatureWebsite(feature);

  return `
    <div class="space-y-1">
      <h3 class="font-semibold text-base text-gray-800">${title}</h3>
      <p class="text-sm text-gray-600">${description}</p>
      ${
        length
          ? `<p class="text-sm font-medium text-sky-600">Délka: ${length}</p>`
          : ""
      }
      ${
        website
          ? `<a href="${website}" target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 underline">Otevřít web</a>`
          : ""
      }
    </div>
  `;
}

export function MapView({
  layers,
  data,
  loading,
  shouldDisplayLayer,
  onSelectFeature,
  selectedFeatureId,
}: MapViewProps) {
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);

  const selectedFeature = useMemo(() => {
    for (const layer of layers) {
      const collection = data[layer.id];
      if (!collection) continue;
      const match = featureCollectionToArray(collection).find(
        (feature) => getFeatureId(feature) === selectedFeatureId,
      );
      if (match) return match;
    }
    return null;
  }, [data, layers, selectedFeatureId]);

  const overlayMessage = useMemo(() => {
    const activeLayerIds = layers
      .filter((layer) => shouldDisplayLayer(layer))
      .map((layer) => layer.id);
    const busy = activeLayerIds.some((layerId) => loading[layerId]);
    if (busy) return "Načítám data z ArcGIS…";
    if (activeLayerIds.length > 0 && activeLayerIds.every((id) => !data[id])) {
      return "Načtěte vrstvu pomocí filtrů.";
    }
    return null;
  }, [data, layers, loading, shouldDisplayLayer]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/20 shadow-xl">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        {layers
          .filter((layer) => shouldDisplayLayer(layer))
          .map((layer) => {
            const collection = data[layer.id];
            if (!collection) return null;

            return (
              <GeoJSON
                key={layer.id}
                data={collection as FeatureCollection}
                style={(feature) => {
                  const featureId = getFeatureId(feature as Feature);
                  const isSelected = featureId === selectedFeatureId;
                  const isHovered = featureId === hoveredFeatureId;
                  const baseOpacity = layer.geometry === "line" ? 1 : 0.4;
                  return {
                    color: layer.color,
                    weight: isSelected
                      ? 5
                      : isHovered
                        ? 4
                        : layer.geometry === "line"
                          ? 3
                          : 1.5,
                    opacity: isSelected || isHovered ? 1 : 0.85,
                    fillOpacity:
                      layer.geometry === "line"
                        ? 0
                        : isSelected
                          ? 0.5
                          : isHovered
                            ? 0.45
                            : baseOpacity,
                    dashArray: layer.geometry === "line" ? "4 8" : undefined,
                  };
                }}
                pointToLayer={(feature, latlng) =>
                  L.circleMarker(latlng, {
                    radius:
                      getFeatureId(feature as Feature) === selectedFeatureId
                        ? 11
                        : 8,
                    color: layer.color,
                    weight: 2,
                    fillOpacity: 0.7,
                  })
                }
                onEachFeature={(feature, leafletLayer) => {
                  const typedFeature = feature as Feature;
                  const featureId = getFeatureId(typedFeature);

                  leafletLayer.on({
                    click: (event: LeafletMouseEvent) => {
                      event.target.openPopup();
                      onSelectFeature(layer.id, typedFeature);
                    },
                    mouseover: () => {
                      setHoveredFeatureId(featureId);
                    },
                    mouseout: () => {
                      setHoveredFeatureId((prev) =>
                        prev === featureId ? null : prev,
                      );
                    },
                  });

                  leafletLayer.bindPopup(getPopupContent(typedFeature), {
                    className: "khk-popup",
                    maxWidth: 320,
                  });
                }}
              />
            );
          })}
        <MapAccessor selectedFeature={selectedFeature} />
      </MapContainer>
      {overlayMessage ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/30 text-center text-sm font-medium text-white backdrop-blur">
          {overlayMessage}
        </div>
      ) : null}
    </div>
  );
}
