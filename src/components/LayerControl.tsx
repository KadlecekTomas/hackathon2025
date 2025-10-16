"use client";

import React from "react";
import type {
  GeoLayerDefinition,
  GeoLayerId,
  LayerMetadata,
} from "@/hooks/useGeoData";

type Props = {
  layers: GeoLayerDefinition[];
  metadataByLayer: Record<GeoLayerId, LayerMetadata>;
  activeLayerSet: Set<GeoLayerId>;
  toggleLayer: (layerId: GeoLayerId) => void;
  setAllLayers: (enabled: boolean) => void;
};

export function LayerControl({
  layers,
  metadataByLayer,
  activeLayerSet,
  toggleLayer,
  setAllLayers,
}: Props) {
  const allEnabled = layers.every((l) => activeLayerSet.has(l.id));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Vrstvy</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllLayers(true)}
            className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700"
          >
            Zapnout vše
          </button>
          <button
            type="button"
            onClick={() => setAllLayers(false)}
            className="rounded-full bg-slate-900/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700"
          >
            Vypnout vše
          </button>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {layers.map((layer) => {
          const meta = metadataByLayer[layer.id];
          const checked = activeLayerSet.has(layer.id);
          return (
            <li
              key={layer.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLayer(layer.id)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium" style={{ color: layer.color }}>
                    {layer.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {meta?.featureCount ?? 0} položek
                  </span>
                </span>
              </label>
              <span className="ml-2 inline-block h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: layer.color }} />
            </li>
          );
        })}
      </ul>

      <div className="mt-3 text-right text-xs text-slate-500">
        {allEnabled ? "Všechny vrstvy zapnuté" : "Některé vrstvy vypnuté"}
      </div>
    </section>
  );
}

