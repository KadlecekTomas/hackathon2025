"use client";

import { motion } from "framer-motion";
import {
  LocateIcon,
  Moon,
  RefreshCcw,
  Sparkles,
  Sun,
} from "lucide-react";

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
  onToggleTheme: () => void;
  isDarkMode: boolean;
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
  onToggleTheme,
  isDarkMode,
}: FilterPanelProps) {
  const ThemeIcon = isDarkMode ? Sun : Moon;
  const themeLabel = isDarkMode ? "Světlý režim" : "Tmavý režim";

  return (
    <motion.section
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6 rounded-3xl border border-white/10 bg-white/10 p-6 text-white shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-200/90">
            Zážitky KHK Explore
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-snug text-white dark:text-slate-50">
            Vyberte oblast a objevujte
          </h2>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <ThemeIcon size={18} />
          {themeLabel}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner shadow-white/5 dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-400">
            Aktivní lokality
          </p>
          <p className="mt-1 text-2xl font-bold text-white dark:text-emerald-200">
            {visibleCount}
          </p>
          <p className="text-xs text-white/60 dark:text-slate-400">
            z {totalCount} dostupných
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner shadow-white/5 dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-400">
            Zapnuté vrstvy
          </p>
          <p className="mt-1 text-2xl font-bold text-white dark:text-emerald-200">
            {activeLayerCount}
          </p>
          <p className="text-xs text-white/60 dark:text-slate-400">
            lze přepnout v legendě
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner shadow-white/5 dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-400">
            Oblíbené tipy
          </p>
          <p className="mt-1 text-2xl font-bold text-white dark:text-emerald-200">
            {favoritesCount}
          </p>
          <p className="text-xs text-white/60 dark:text-slate-400">
            uložené v zařízení
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner shadow-white/5 dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-400">
            Nejbližší zážitek
          </p>
          <p className="mt-1 text-sm font-semibold text-white/90 dark:text-emerald-100">
            {nearestInfo ?? "Lokalizujte se pro doporučení"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-400">
            Okres
          </span>
          <select
            value={selectedDistrict ?? ""}
            onChange={(event) =>
              onDistrictChange(event.target.value || null)
            }
            className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-900"
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
          <span className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-400">
            Turistický region
          </span>
          <select
            value={selectedRegion ?? ""}
            onChange={(event) => onRegionChange(event.target.value || null)}
            className="w-full rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-900"
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
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
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
          className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <LocateIcon size={16} />
          {locating ? "Zjišťuji pozici…" : "Najít nejbližší tip"}
        </button>
      </div>
    </motion.section>
  );
}
