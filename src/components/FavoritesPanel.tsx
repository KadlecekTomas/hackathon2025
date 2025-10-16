"use client";

import type { FavoriteFeature } from "@/utils/storageUtils";

type FavoritesPanelProps = {
  favorites: FavoriteFeature[];
  onSelect: (favorite: FavoriteFeature) => void;
  onRemove: (favoriteId: string) => void;
};

export function FavoritesPanel({
  favorites,
  onSelect,
  onRemove,
}: FavoritesPanelProps) {
  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/50 p-5 text-white shadow-xl backdrop-blur">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">⭐ Oblíbené</h2>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/70">
          {favorites.length} položek
        </span>
      </header>

      {favorites.length === 0 ? (
        <p className="text-sm text-white/70">
          Přidejte si první trasu nebo místo do oblíbených hvězdičkou v detailu.
        </p>
      ) : (
        <ul className="space-y-2">
          {favorites.map((favorite) => (
            <li
              key={favorite.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-white/90 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onSelect(favorite)}
                  className="text-left text-base font-semibold text-white hover:text-emerald-300"
                >
                  {favorite.title}
                </button>
                <p className="text-xs uppercase tracking-wide text-white/60">
                  Vrstva: {favorite.layerId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(favorite)}
                  className="rounded-full border border-emerald-400/60 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
                >
                  Zobrazit
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(favorite.id)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/60 transition hover:border-red-400/60 hover:text-red-200"
                >
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
