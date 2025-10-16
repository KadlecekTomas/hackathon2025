export type FavoriteFeature = {
  id: string;
  layerId: string;
  title: string;
  layerTitle?: string;
  geometryType?: string;
  properties?: Record<string, unknown>;
};

const STORAGE_KEY = "khk-explore-favorites";

const isBrowser = typeof window !== "undefined";

function safeReadLocalStorage(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore quota + privacy mode errors.
  }
}

export function loadFavorites(): FavoriteFeature[] {
  const raw = safeReadLocalStorage(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FavoriteFeature[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: FavoriteFeature[]): void {
  safeWriteLocalStorage(STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavorite(
  favorites: FavoriteFeature[],
  candidateId: string,
  layerId?: string,
): boolean {
  return favorites.some(
    (item) => item.id === candidateId && (!layerId || item.layerId === layerId),
  );
}

export function upsertFavorite(
  favorites: FavoriteFeature[],
  feature: FavoriteFeature,
): FavoriteFeature[] {
  if (isFavorite(favorites, feature.id, feature.layerId)) {
    return favorites;
  }
  const nextFavorites = [...favorites, feature];
  saveFavorites(nextFavorites);
  return nextFavorites;
}

export function removeFavorite(
  favorites: FavoriteFeature[],
  featureId: string,
  layerId?: string,
): FavoriteFeature[] {
  const nextFavorites = favorites.filter(
    (fav) => fav.id !== featureId || (layerId && fav.layerId !== layerId),
  );
  saveFavorites(nextFavorites);
  return nextFavorites;
}

export function toggleFavorite(
  favorites: FavoriteFeature[],
  feature: FavoriteFeature,
): FavoriteFeature[] {
  if (isFavorite(favorites, feature.id, feature.layerId)) {
    return removeFavorite(favorites, feature.id, feature.layerId);
  }
  return upsertFavorite(favorites, feature);
}
