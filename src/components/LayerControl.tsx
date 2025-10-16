"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Bike, Church, Layers3, Map as MapIcon, TreePine } from "lucide-react";
import type {
  GeoLayerDefinition,
  GeoLayerId,
  LayerMetadata,
} from "@/hooks/useGeoData";
import { StarOfDavidIcon } from "@/components/icons/customIcons";

const iconRegistry: Record<string, LucideIcon> = {
  bike: Bike,
  church: Church,
  map: MapIcon,
  "star-of-david": StarOfDavidIcon,
  tree: TreePine,
};

type LayerControlProps = {
  layers: GeoLayerDefinition[];
  metadataByLayer: Record<GeoLayerId, LayerMetadata>;
  activeLayerSet: Set<GeoLayerId>;
  toggleLayer: (layerId: GeoLayerId) => void;
  setAllLayers: (enabled: boolean) => void;
};

function LayerRow({
  layer,
  isActive,
  metadata,
  onToggle,
}: {
  layer: GeoLayerDefinition;
  isActive: boolean;
  metadata: LayerMetadata | undefined;
  onToggle: () => void;
}) {
  const IconComponent =
    iconRegistry[layer.icon] ?? MapIcon;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-all",
        "bg-white/10 hover:bg-white/20 dark:bg-slate-900/60 dark:hover:bg-slate-800/60",
        isActive
          ? "border-white/60 shadow-lg shadow-black/20 dark:border-emerald-400/60"
          : "border-white/20 opacity-80 hover:opacity-100 dark:border-slate-700",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-inner shadow-black/30"
          style={{ background: layer.color }}
        >
          <IconComponent size={22} strokeWidth={1.75} />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white dark:text-slate-100">
            {layer.title}
          </span>
          <span className="text-xs text-white/70 dark:text-slate-400">
            {metadata?.featureCount ?? 0} lokalit
          </span>
        </div>
      </div>
      <span
        className={[
          "inline-flex h-5 w-10 items-center justify-center rounded-full text-[10px] font-semibold uppercase tracking-wide",
          isActive
            ? "bg-emerald-400 text-emerald-900"
            : "bg-white/20 text-white/80 dark:bg-slate-700 dark:text-slate-200",
        ].join(" ")}
      >
        {isActive ? "ON" : "OFF"}
      </span>
    </button>
  );
}

export function LayerControl({
  layers,
  metadataByLayer,
  activeLayerSet,
  toggleLayer,
  setAllLayers,
}: LayerControlProps) {
  const [isMobilePanelOpen, setMobilePanelOpen] = useState(false);

  const activeCount = useMemo(() => activeLayerSet.size, [activeLayerSet]);

  return (
    <>
      <div className="hidden flex-col gap-3 lg:flex">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 text-sm text-white shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
          <div className="flex items-center gap-2">
            <Layers3 size={18} />
            <span>Správa vrstev</span>
          </div>
          <button
            type="button"
            onClick={() => setAllLayers(activeCount !== layers.length)}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/30 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            {activeCount === layers.length ? "Vypnout vše" : "Zapnout vše"}
          </button>
        </div>
        <div className="grid gap-3">
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              metadata={metadataByLayer[layer.id]}
              isActive={activeLayerSet.has(layer.id)}
              onToggle={() => toggleLayer(layer.id)}
            />
          ))}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobilePanelOpen((prev) => !prev)}
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 shadow-xl shadow-emerald-500/30 transition hover:shadow-emerald-500/50"
        >
          <Layers3 size={18} />
          Vrstvy ({activeCount}/{layers.length})
        </button>
        <AnimatePresence>
          {isMobilePanelOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-white/20 bg-slate-950/90 p-5 text-white shadow-2xl backdrop-blur dark:border-slate-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Výběr vrstev
                </h3>
                <button
                  type="button"
                  onClick={() => setAllLayers(activeCount !== layers.length)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80"
                >
                  {activeCount === layers.length ? "Vypnout vše" : "Zapnout vše"}
                </button>
              </div>
              <div className="grid gap-3">
                {layers.map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    metadata={metadataByLayer[layer.id]}
                    isActive={activeLayerSet.has(layer.id)}
                    onToggle={() => toggleLayer(layer.id)}
                  />
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
