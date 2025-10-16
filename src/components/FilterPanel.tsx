"use client";

import { useState } from "react";
import type { FilterKey } from "@/hooks/useFilters";

const FILTER_OPTIONS: Array<{
  key: FilterKey;
  label: string;
  accent: string;
}> = [
  { key: "vse", label: "Vše", accent: "from-slate-700/80 to-slate-900/80" },
  {
    key: "cyklotrasy",
    label: "Cyklotrasy",
    accent: "from-blue-600/90 to-blue-700/90",
  },
  {
    key: "pamatky",
    label: "Památky",
    accent: "from-amber-500/90 to-amber-600/90",
  },
  {
    key: "priroda",
    label: "Příroda",
    accent: "from-emerald-500/90 to-emerald-600/90",
  },
];

type FilterPanelProps = {
  activeFilters: FilterKey[];
  toggleFilter: (filter: FilterKey) => void;
  onRandomTip: () => void;
  onReset?: () => void;
};

export function FilterPanel({
  activeFilters,
  toggleFilter,
  onRandomTip,
  onReset,
}: FilterPanelProps) {
  const [openMobile, setOpenMobile] = useState(false);

  return (
    <section className="space-y-4 rounded-3xl bg-slate-900/50 p-5 text-white shadow-xl backdrop-blur">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Filtrovat vrstvy
          </h2>
          <p className="text-sm text-slate-300">
            Vyberte, jaké typy zážitků se mají zobrazit na mapě.
          </p>
        </div>
        <button
          type="button"
          onClick={onRandomTip}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold transition-all hover:bg-white/20"
        >
          <span aria-hidden>🎲</span>
          Kam dnes?
        </button>
      </header>

      <div className="hidden gap-3 sm:flex">
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilters.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => toggleFilter(option.key)}
              className={[
                "flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold transition-all",
                "bg-gradient-to-br",
                option.accent,
                isActive
                  ? "shadow-lg shadow-black/30 ring-2 ring-white/20"
                  : "opacity-60 hover:opacity-90",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
        >
          <span>Filtrovat vrstvy</span>
          <span className="text-xs uppercase tracking-wide text-white/70">
            {openMobile ? "Zavřít" : "Otevřít"}
          </span>
        </button>
        {openMobile ? (
          <div className="mt-3 grid gap-2">
            {FILTER_OPTIONS.map((option) => {
              const isActive = activeFilters.includes(option.key);
              return (
                <label
                  key={option.key}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-xs uppercase tracking-wide"
                >
                  <span>{option.label}</span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleFilter(option.key)}
                    className="h-4 w-4 rounded border-white/20 bg-white/10 accent-sky-400"
                  />
                </label>
              );
            })}
          </div>
        ) : null}
      </div>

      <footer className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Pokročilé filtrování</p>
          <p className="text-xs text-slate-300">
            Připravte si vlastní vrstvy podle obtížnosti nebo okresu.
          </p>
        </div>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:bg-white/20"
          >
            Obnovit výchozí
          </button>
        ) : null}
      </footer>
    </section>
  );
}
