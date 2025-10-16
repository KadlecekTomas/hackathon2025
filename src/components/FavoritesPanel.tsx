"use client";

import { Heart, MapPinned, Trash2 } from "lucide-react";
import type { FavoriteFeature } from "@/utils/storageUtils";

type FavoritesPanelProps = {
  favorites: FavoriteFeature[];
  onSelect: (favorite: FavoriteFeature) => void;
  onRemove: (favorite: FavoriteFeature) => void;
};

export function FavoritesPanel({
  favorites,
  onSelect,
  onRemove,
}: FavoritesPanelProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-5 text-white shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Heart size={18} className="text-emerald-300" />
          <span>Oblíbené výlety</span>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70 dark:bg-slate-800 dark:text-slate-300">
          {favorites.length} položek
        </span>
      </header>

      {favorites.length === 0 ? (
        <p className="text-sm text-white/70 dark:text-slate-400">
          Uložte si tip hvězdičkou v detailu a rychle se k němu vracejte.
        </p>
      ) : (
        <ul className="space-y-3">
          {favorites.map((favorite) => (
            <li
              key={`${favorite.layerId}:${favorite.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm shadow-inner shadow-white/10 transition hover:border-emerald-400/40 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-emerald-400/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(favorite)}
                  className="text-left text-base font-semibold text-white transition hover:text-emerald-300 dark:text-slate-100 dark:hover:text-emerald-300"
                >
                  {favorite.title}
                </button>
                <p className="text-xs uppercase tracking-wide text-white/60 dark:text-slate-400">
                  {favorite.layerTitle ?? favorite.layerId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(favorite)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400/60 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10 dark:border-emerald-400/50 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                >
                  <MapPinned size={14} />
                  Zobrazit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(favorite)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70 transition hover:border-red-400/60 hover:text-red-200 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-400/60 dark:hover:text-red-200"
                >
                  <Trash2 size={14} />
                  Odebrat
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
