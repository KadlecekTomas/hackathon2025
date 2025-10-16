"use client";

import { Heart, MapPinned, Trash2 } from "lucide-react";
import type { FavoriteFeature } from "@/utils/storageUtils";

type FavoritesPanelProps = {
  favorites: FavoriteFeature[];
  onSelect: (favorite: FavoriteFeature) => void;
  onRemove: (favorite: FavoriteFeature) => void;
};

export function FavoritesPanel({ favorites, onSelect, onRemove }: FavoritesPanelProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-lg">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Heart size={18} className="text-emerald-500" />
          <span>Oblíbené výlety</span>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-500">
          {favorites.length} položek
        </span>
      </header>

      {favorites.length === 0 ? (
        <p className="text-sm text-slate-500">
          Uložte si tip hvězdičkou v detailu a rychle se k němu vracejte.
        </p>
      ) : (
        <ul className="space-y-3">
          {favorites.map((favorite) => (
            <li
              key={`${favorite.layerId}:${favorite.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner shadow-slate-200/70 transition hover:border-emerald-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(favorite)}
                  className="text-left text-base font-semibold text-slate-900 transition hover:text-emerald-500"
                >
                  {favorite.title}
                </button>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {favorite.layerTitle ?? favorite.layerId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(favorite)}
                  className="inline-flex items-center gap-2 rounded-full border border-emerald-400 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-400 hover:text-emerald-950 cursor-pointer"
                >
                  <MapPinned size={14} />
                  Zobrazit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(favorite)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-red-400 hover:text-red-500 cursor-pointer"
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
