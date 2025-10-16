"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LocateIcon, RefreshCcw, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // ✅ zabrání zavření při kliknutí na tlačítka, selecty atd.
    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    const noToggleTags = ["button", "select", "option", "svg", "path", "input", "label"];

    if (noToggleTags.includes(tag) || target.closest("button, select, input, label")) {
      return;
    }

    setIsOpen((prev) => !prev);
  };

  return (
    <motion.section
      onClick={handleToggle}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 sm:p-5 cursor-pointer"
    >
      {/* --- Header bar --- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 w-full">
          <div className="flex items-center gap-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Zážitky KHK Explore
            </p>
            <h2 className="text-base sm:text-lg font-semibold leading-snug text-slate-800">
              Informace a filtry
            </h2>
          </div>

          {/* --- Action buttons right --- */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRandomTip();
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 cursor-pointer"
              >
                <Sparkles size={16} />
                🎲 Kam dnes?
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLocate();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
              >
                <LocateIcon size={16} />
                {locating ? "Zjišťuji pozici…" : "Najít nejbližší tip"}
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100"
            >
              {isOpen ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- Collapsible --- */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden mt-5 space-y-6"
          >
            {/* --- Stat cards --- */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Aktivní lokality",
                  value: visibleCount,
                  sub: `z ${totalCount} dostupných`,
                },
                {
                  label: "Zapnuté vrstvy",
                  value: activeLayerCount,
                  sub: "lze přepnout v legendě",
                },
                {
                  label: "Oblíbené tipy",
                  value: favoritesCount,
                  sub: "uložené v zařízení",
                },
                {
                  label: "Nejbližší zážitek",
                  value: nearestInfo ?? "Lokalizujte se pro doporučení",
                  isText: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p
                    className={`mt-1 ${item.isText
                        ? "text-sm font-semibold text-slate-700"
                        : "text-2xl font-bold"
                      }`}
                  >
                    {item.value}
                  </p>
                  <p className="text-xs text-slate-500">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* --- Filters --- */}
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-slate-500">Okres</span>
                <select
                  value={selectedDistrict ?? ""}
                  onChange={(event) => onDistrictChange(event.target.value || null)}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFilters();
                }}
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <RefreshCcw size={16} />
                Vymazat
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
