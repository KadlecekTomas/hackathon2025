"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Feature } from "geojson";
import {
  FileDown,
  Share2,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import {
  getFeatureCategoryHint,
  getFeatureDescription,
  getFeatureDistrict,
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
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_CITIES.filter((city) => city.distanceKm <= radiusKm).sort(
    (a, b) => a.distanceKm - b.distanceKm,
  );
}

export type RecommendationItem = {
  id: string;
  layerId: string;
  layerTitle: string;
  title: string;
  district?: string | null;
  distanceKm?: number | null;
};

type DetailPanelProps = {
  feature: Feature | null;
  layerTitle?: string;
  layerColor?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onExportPdf: () => void;
  recommendations: RecommendationItem[];
  onSelectRecommendation: (layerId: string, featureId: string) => void;
  nearestDistance?: number | null;
};

export function DetailPanel({
  feature,
  layerTitle = "Vrstva",
  layerColor = "#38bdf8",
  isFavorite,
  onToggleFavorite,
  onShare,
  onExportPdf,
  recommendations,
  onSelectRecommendation,
  nearestDistance,
}: DetailPanelProps) {
  const [radiusKm, setRadiusKm] = useState("25");
  const [nearby, setNearby] = useState<NearbyCity[] | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const featureTitle = useMemo(
    () => (feature ? getFeatureTitle(feature) : null),
    [feature],
  );

  const description = feature ? getFeatureDescription(feature) : null;
  const length = feature ? getFeatureLength(feature) : null;
  const phone = feature ? getFeaturePhone(feature) : null;
  const website = feature ? getFeatureWebsite(feature) : null;
  const municipality = feature ? getFeatureMunicipality(feature) : null;
  const district = feature ? getFeatureDistrict(feature) : null;
  const region = feature ? getFeatureRegion(feature) : null;
  const categoryHint = feature ? getFeatureCategoryHint(feature) : null;

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
      <motion.aside
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-200 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
      >
        <span className="text-4xl">🧭</span>
        <p className="max-w-xs text-balance">
          Klepněte na trasu nebo místo v mapě a my vám zobrazíme detailní
          informace, doporučení i tipy pro výlet.
        </p>
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex h-full flex-col gap-5 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-slate-100 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
    >
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-wide text-white/70 dark:text-emerald-200/90"
            style={{
              background: `${layerColor}20`,
              border: `1px solid ${layerColor}40`,
              color: layerColor,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: layerColor }} />
            {layerTitle}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              className="rounded-2xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Share2 size={14} className="inline-block" /> Sdílet
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="rounded-2xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <FileDown size={14} className="inline-block" /> Export
            </button>
            <button
              type="button"
              onClick={onToggleFavorite}
              className={[
                "inline-flex items-center gap-1 rounded-2xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                isFavorite
                  ? "border-yellow-400 bg-yellow-400/10 text-yellow-300"
                  : "border-white/20 text-white/80 hover:bg-white/10 dark:border-slate-700 dark:text-slate-200",
              ].join(" ")}
            >
              <Star size={14} />
              {isFavorite ? "Uloženo" : "Uložit"}
            </button>
          </div>
        </div>

        <h2 className="text-3xl font-bold leading-tight text-white dark:text-slate-50">
          {featureTitle}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-slate-200/90 dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </header>

      <section className="space-y-3 rounded-2xl bg-white/5 p-4 text-sm dark:bg-slate-900/70">
        <h3 className="text-xs uppercase tracking-wide text-white/60 dark:text-slate-400">
          Základní informace
        </h3>
        <ul className="space-y-2 text-slate-200 dark:text-slate-200/90">
          {municipality ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Obec:
              </span>{" "}
              {municipality}
            </li>
          ) : null}
          {district ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Okres:
              </span>{" "}
              {district}
            </li>
          ) : null}
          {region ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Region:
              </span>{" "}
              {region}
            </li>
          ) : null}
          {length ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Délka:
              </span>{" "}
              {length}
            </li>
          ) : null}
          {categoryHint ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Typ:
              </span>{" "}
              {categoryHint}
            </li>
          ) : null}
          {phone ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Telefon:
              </span>{" "}
              <a href={`tel:${phone}`} className="text-emerald-300 underline">
                {phone}
              </a>
            </li>
          ) : null}
          {website ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Web:
              </span>{" "}
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
          {typeof nearestDistance === "number" ? (
            <li>
              <span className="font-semibold text-white/80 dark:text-slate-100">
                Vzdálenost od vás:
              </span>{" "}
              {nearestDistance.toFixed(1)} km
            </li>
          ) : null}
          <li className="text-xs text-slate-300 dark:text-slate-500">
            ID záznamu: {getFeatureId(feature)}
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-white/5 p-4 text-sm dark:bg-slate-900/70">
        <header className="flex items-center gap-3">
          <Wand2 size={18} className="text-emerald-300" />
          <div>
            <h3 className="text-xs uppercase tracking-wide text-white/70 dark:text-slate-400">
              Doporučujeme také navštívit
            </h3>
            <p className="text-xs text-white/60 dark:text-slate-400">
              Výběr podobných lokalit ve stejném okrese nebo kategorii.
            </p>
          </div>
        </header>
        {recommendations.length === 0 ? (
          <p className="text-xs text-white/60 dark:text-slate-400">
            Načítáme další tipy nebo zvolte jiný filtr.
          </p>
        ) : (
          <ul className="space-y-2">
            {recommendations.map((item) => (
              <li
                key={`${item.layerId}:${item.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div>
                  <p className="text-sm font-semibold text-white dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="text-xs text-white/60 dark:text-slate-400">
                    {item.layerTitle}
                    {item.district ? ` · ${item.district}` : ""}
                    {typeof item.distanceKm === "number"
                      ? ` · ${item.distanceKm.toFixed(1)} km`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectRecommendation(item.layerId, item.id)}
                  className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400"
                >
                  Otevřít
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-2xl bg-white/5 p-4 text-sm dark:bg-slate-900/70">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs uppercase tracking-wide text-white/60 dark:text-slate-400">
            Najdi města v okolí
          </h3>
          <span className="text-xs text-white/50 dark:text-slate-500">
            demo výpočet bez volání API
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <label className="flex-1 text-xs uppercase tracking-wide text-white/60 dark:text-slate-400">
            Poloměr (km)
            <input
              type="number"
              min={5}
              step={1}
              value={radiusKm}
              onChange={(event) => setRadiusKm(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 dark:border-slate-700 dark:bg-slate-900"
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
          <p className="flex items-center gap-2 text-xs text-white/70 dark:text-slate-400">
            <Sparkles size={14} /> Hledám místa v okruhu {radiusKm} km…
          </p>
        ) : nearby && nearby.length > 0 ? (
          <ul className="space-y-2">
            {nearby.map((city) => (
              <li
                key={city.name}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div>
                  <p className="text-sm font-semibold text-white/90 dark:text-slate-100">
                    {city.name}
                  </p>
                  <p className="text-xs text-white/60 dark:text-slate-400">
                    Obyvatel:{" "}
                    {new Intl.NumberFormat("cs-CZ").format(city.population)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-300 dark:text-emerald-200">
                  {city.distanceKm} km
                </span>
              </li>
            ))}
          </ul>
        ) : nearby ? (
          <p className="text-xs text-white/70 dark:text-slate-400">
            V zadaném okruhu jsme nenašli žádné město z demodat.
          </p>
        ) : (
          <p className="text-xs text-white/60 dark:text-slate-400">
            Zadejte poloměr a získejte tipy na větší města v okolí pro doprovodný
            program.
          </p>
        )}
      </section>
    </motion.aside>
  );
}
