import type { FeatureCollection } from "geojson";

type FetchGeoJsonOptions = {
  /**
   * Optional AbortSignal to support cancelling inflight requests.
   */
  signal?: AbortSignal;
  /**
   * Optional local fallback URL (e.g., `/data/sample.json`) used when the remote
   * request fails. The fallback is still cached to avoid repeated reads.
   */
  fallbackUrl?: string;
};

const memoryCache = new Map<string, FeatureCollection>();

const isBrowser = typeof window !== "undefined";

const LOCAL_CACHE_KEY = "khk-explore-geo-cache";

type PersistedCache = Record<string, FeatureCollection>;

function getPersistedCache(): PersistedCache {
  if (!isBrowser) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedCache;
  } catch {
    // Ignore JSON issues and fall back to an empty cache.
    return {};
  }
}

function setPersistedCache(cache: PersistedCache) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Swallow quota errors silently – fresh data will be fetched when needed.
  }
}

/**
 * Fetches GeoJSON data with a simple first-level cache (memory + localStorage).
 *
 * The function prioritises fresh network data but falls back to cached copies to
 * keep the UI responsive offline or when the API temporarily fails.
 */
export async function fetchGeoJson(
  url: string,
  options: FetchGeoJsonOptions = {},
): Promise<FeatureCollection> {
  if (!url) {
    throw new Error("fetchGeoJson vyžaduje platný URL parametr.");
  }

  if (memoryCache.has(url)) {
    return memoryCache.get(url)!;
  }

  const persistedCache = getPersistedCache();
  if (persistedCache[url]) {
    memoryCache.set(url, persistedCache[url]);
    return persistedCache[url];
  }

  try {
    const response = await fetch(url, {
      signal: options.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Chyba při načítání GeoJSON: ${response.statusText}`);
    }
    const data = (await response.json()) as FeatureCollection;
    memoryCache.set(url, data);
    setPersistedCache({ ...persistedCache, [url]: data });
    return data;
  } catch (networkError) {
    if (options.fallbackUrl) {
      const fallbackResponse = await fetch(options.fallbackUrl, {
        signal: options.signal,
        cache: "force-cache",
      });
      if (!fallbackResponse.ok) {
        throw networkError;
      }
      const fallbackData = (await fallbackResponse.json()) as FeatureCollection;
      memoryCache.set(url, fallbackData);
      return fallbackData;
    }
    throw networkError;
  }
}
