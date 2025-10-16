"use client";

import { motion } from "framer-motion";
import { LocateIcon, RefreshCcw, Sparkles } from "lucide-react";

type FilterPanelProps = {
  availableDistricts: string[];
  availableRegions: string[];
  selectedDistrict: string | null;
  selectedRegion: string | null;
  onDistrictChange: (value: string | null) => void;
  onRegionChange: (value: string | null) => void;
  onClearFilters: () => void;
  onRandomTip: () => void;
  onLocate: () => void;
  locating: boolean;
  nearestInfo: string | null;
  visibleCount: number;
  totalCount: number;
  favoritesCount: number;
  activeLayerCount: number;
};

export function FilterPanel({
  availableDistricts,
  availableRegions,
  selectedDistrict,
  selectedRegion,
  onDistrictChange,
  onRegionChange,
  onClearFilters,
  onRandomTip,
  onLocate,
  locating,
  nearestInfo,
  visibleCount,
  totalCount,
  favoritesCount,
  activeLayerCount,
}: FilterPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Zážitky KHK Explore
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-snug">
            Vyberte oblast a objevujte
          </h2>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner shadow-slate-200/80">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Aktivní lokality
          </p>
          <p className="mt-1 text-2xl font-bold">{visibleCount}</p>
          <p className="text-xs text-slate-500">z {totalCount} dostupných</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner shadow-slate-200/80">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Zapnuté vrstvy
          </p>
          <p className="mt-1 text-2xl font-bold">{activeLayerCount}</p>
          <p className="text-xs text-slate-500">lze přepnout v legendě</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner shadow-slate-200/80">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Oblíbené tipy
          </p>
          <p className="mt-1 text-2xl font-bold">{favoritesCount}</p>
          <p className="text-xs text-slate-500">uložené v zařízení</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner shadow-slate-200/80">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Nejbližší zážitek
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {nearestInfo ?? "Lokalizujte se pro doporučení"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Okres
          </span>
          <select
            value={selectedDistrict ?? ""}
            onChange={(event) =>
              onDistrictChange(event.target.value || null)
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">Všechny okresy</option>
            {availableDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Turistický region
          </span>
          <select
            value={selectedRegion ?? ""}
            onChange={(event) => onRegionChange(event.target.value || null)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="">Všechny regiony</option>
            {availableRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onClearFilters}
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <RefreshCcw size={16} />
          Vymazat
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRandomTip}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
        >
          <Sparkles size={16} />
          🎲 Kam dnes?
        </button>
        <button
          type="button"
          onClick={onLocate}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <LocateIcon size={16} />
          {locating ? "Zjišťuji pozici…" : "Najít nejbližší tip"}
        </button>
      </div>
    </motion.section>
  );
}
