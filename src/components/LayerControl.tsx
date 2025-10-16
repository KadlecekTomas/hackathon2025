"use client";

import React, { useState, useEffect, useRef } from "react";
import type {
  GeoLayerDefinition,
  GeoLayerId,
  LayerMetadata,
} from "@/hooks/useGeoData";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [open, setOpen] = useState(false); // defaultně zavřeno
  const alreadyHandled = useRef(false); // zabrání vícenásobnému volání

  useEffect(() => {
    if (alreadyHandled.current) return;
    if (layers.length === 0 || activeLayerSet.size === 0) return;

    const target = layers.find(
      (l) => l.title.toLowerCase().includes("turistické regiony")
    );
    if (target && activeLayerSet.has(target.id)) {
      toggleLayer(target.id);
      alreadyHandled.current = true; // označí, že už jsme to provedli
    }
  }, [layers, activeLayerSet, toggleLayer]);

  const allEnabled = layers.every((l) => activeLayerSet.has(l.id));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 text-slate-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between transition  "
      >
        <h2 className="text-base sm:text-lg font-semibold leading-snug text-slate-800">Filtry</h2>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
          {open ? (
            <ChevronUp className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-600" />
          )}
        </div>
      </button>

      {open && (
        <div className="mt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
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
                      <span
                        className="truncate font-medium"
                        style={{ color: layer.color }}
                      >
                        {layer.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {meta?.featureCount ?? 0} položek
                      </span>
                    </span>
                  </label>
                  <span
                    className="ml-2 inline-block h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                </li>
              );
            })}
          </ul>

          <div className="mt-3 text-right text-xs text-slate-500">
            {allEnabled ? "Všechny vrstvy zapnuté" : "Některé vrstvy vypnuté"}
          </div>
        </div>
      )}
    </section>
  );
}
