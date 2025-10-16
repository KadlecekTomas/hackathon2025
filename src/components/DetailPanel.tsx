"use client";

import { useMemo, useState } from "react";
import type { Feature } from "geojson";
import {
  getFeatureDescription,
  getFeatureId,
  getFeatureLength,
  getFeatureMunicipality,
  getFeaturePhone,
  getFeatureRegion,
  getFeatureTitle,
  getFeatureWebsite,
} from "@/utils/featureUtils";

type NearbyCity = {
  name: string;
  distanceKm: number;
  population: number;
};

const MOCK_CITIES: NearbyCity[] = [
  { name: "Hradec Králové", distanceKm: 12, population: 92939 },
  { name: "Jičín", distanceKm: 31, population: 16262 },
  { name: "Trutnov", distanceKm: 44, population: 30550 },
  { name: "Rychnov nad Kněžnou", distanceKm: 24, population: 11221 },
  { name: "Dvůr Králové nad Labem", distanceKm: 37, population: 15793 },
  { name: "Náchod", distanceKm: 49, population: 19113 },
  { name: "Nová Paka", distanceKm: 52, population: 8761 },
  { name: "Jaroměř", distanceKm: 28, population: 12128 },
];

async function mockFindNearbyCities(radiusKm: number): Promise<NearbyCity[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return MOCK_CITIES.filter((city) => city.distanceKm <= radiusKm).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}

type DetailPanelProps = {
  feature: Feature | null;
  layerTitle?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function DetailPanel({
  feature,
  layerTitle = "Vrstva",
  isFavorite,
  onToggleFavorite,
}: DetailPanelProps) {
  const [radiusKm, setRadiusKm] = useState("20");
  const [nearby, setNearby] = useState<NearbyCity[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const featureTitle = useMemo(
    () => (feature ? getFeatureTitle(feature) : null),
    [feature],
  );

  const length = feature ? getFeatureLength(feature) : null;
  const phone = feature ? getFeaturePhone(feature) : null;
  const website = feature ? getFeatureWebsite(feature) : null;
  const municipality = feature ? getFeatureMunicipality(feature) : null;
  const region = feature ? getFeatureRegion(feature) : "Královéhradecký kraj";

  const description = feature ? getFeatureDescription(feature) : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!feature) return;
    const parsed = Number(radiusKm);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setNearbyError("Zadejte prosím kladnou vzdálenost v kilometrech.");
      return;
    }
    setNearbyError(null);
    setNearbyLoading(true);
    try {
      const results = await mockFindNearbyCities(parsed);
      setNearby(results);
    } catch (error) {
      setNearbyError(
        error instanceof Error
          ? error.message
          : "Nepodařilo se načíst okolní města.",
      );
    } finally {
      setNearbyLoading(false);
    }
  };

  if (!feature) {
    return (
      <aside className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-200 backdrop-blur">
        <span className="text-4xl">🧭</span>
        <p className="max-w-xs text-balance">
          Vyberte trasu nebo místo v mapě a podrobnosti se zobrazí zde.
        </p>
      </aside>
    );
  }

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-slate-100 shadow-xl backdrop-blur">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {layerTitle}
          </p>
          <button
            type="button"
            onClick={onToggleFavorite}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
              isFavorite
                ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                : "border-white/20 text-white/80 hover:bg-white/10",
            ].join(" ")}
          >
            <span aria-hidden>{isFavorite ? "⭐" : "☆"}</span>
            Oblíbené
          </button>
        </div>

        <h2 className="text-2xl font-bold leading-tight text-white">
          {featureTitle}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-slate-200/90">
            {description}
          </p>
        ) : null}
      </header>

      <section className="space-y-2 rounded-2xl bg-white/5 p-4 text-sm">
        <h3 className="text-xs uppercase tracking-wide text-white/60">
          Základní informace
        </h3>
        <ul className="space-y-2 text-slate-200">
          {municipality ? (
            <li>
              <span className="font-semibold text-white/80">Obec:</span>{" "}
              {municipality}
            </li>
          ) : null}
          {region ? (
            <li>
              <span className="font-semibold text-white/80">Kraj:</span>{" "}
              {region}
            </li>
          ) : null}
          {length ? (
            <li>
              <span className="font-semibold text-white/80">Délka:</span>{" "}
              {length}
            </li>
          ) : null}
          {phone ? (
            <li>
              <span className="font-semibold text-white/80">Telefon:</span>{" "}
              <a href={`tel:${phone}`} className="text-emerald-300">
                {phone}
              </a>
            </li>
          ) : null}
          {website ? (
            <li>
              <span className="font-semibold text-white/80">Web:</span>{" "}
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline"
              >
                Otevřít stránky
              </a>
            </li>
          ) : null}
          <li className="text-xs text-slate-300">
            ID záznamu: {getFeatureId(feature)}
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-white/5 p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs uppercase tracking-wide text-white/60">
            Najdi města v okolí
          </h3>
          <span className="text-xs text-white/50">
            demo výpočet bez volání API
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <label className="flex-1 text-xs uppercase tracking-wide text-white/60">
            Poloměr (km)
            <input
              type="number"
              min={1}
              step={1}
              value={radiusKm}
              onChange={(event) => setRadiusKm(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900/60 disabled:text-emerald-200/60"
            disabled={nearbyLoading}
          >
            Vyhledat
          </button>
        </form>

        {nearbyError ? (
          <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {nearbyError}
          </p>
        ) : null}

        {nearbyLoading ? (
          <p className="text-xs text-white/70">
            Hledám města v okruhu {radiusKm} km…
          </p>
        ) : nearby && nearby.length > 0 ? (
          <ul className="space-y-2">
            {nearby.map((city) => (
              <li
                key={city.name}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-white/90">
                    {city.name}
                  </p>
                  <p className="text-xs text-white/60">
                    Obyvatel:{" "}
                    {new Intl.NumberFormat("cs-CZ").format(city.population)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-300">
                  {city.distanceKm} km
                </span>
              </li>
            ))}
          </ul>
        ) : nearby ? (
          <p className="text-xs text-white/70">
            V zadaném okruhu jsme nenašli žádné město z demodat.
          </p>
        ) : (
          <p className="text-xs text-white/60">
            Zadejte poloměr a získejte návrhy měst pro výlety v okolí.
          </p>
        )}
      </section>
    </aside>
  );
}
