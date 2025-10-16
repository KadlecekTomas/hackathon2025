"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Feature } from "geojson";
import { FileDown, Share2, Sparkles, Star, Wand2 } from "lucide-react";
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
  { name: "Hradec Kralove", distanceKm: 0, population: 92939 },
  { name: "Jicin", distanceKm: 32, population: 16262 },
  { name: "Trutnov", distanceKm: 40, population: 30550 },
  { name: "Rychnov nad Kneznou", distanceKm: 24, population: 11221 },
  { name: "Dvur Kralove nad Labem", distanceKm: 31, population: 15793 },
  { name: "Nachod", distanceKm: 26, population: 19113 },
  { name: "Nova Paka", distanceKm: 33, population: 8761 },
  { name: "Jaromer", distanceKm: 17, population: 12128 },
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
  layerColor = "#0ea5e9",
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
      setNearbyError("Zadejte prosim kladnou vzdalenost v kilometrech.");
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
          : "Nepodarilo se nacist okolni mesta.",
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
        className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-lg"
      >
        <span className="text-4xl">🧭</span>
        <p className="max-w-xs text-balance">
          Klepnete na trasu nebo misto v mape a hned zobrazime detailni
          informace, tipy i prakticke rady.
        </p>
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex h-full flex-col gap-5 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
    >
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs uppercase tracking-wide text-slate-600"
            style={{
              background: `${layerColor}20`,
              border: `1px solid ${layerColor}40`,
              color: layerColor,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: layerColor }}
            />
            {layerTitle}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onShare}
              className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100 cursor-pointer"
            >
              <Share2 size={14} className="inline-block" /> Sdílet
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              className="rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100 cursor-pointer"
            >
              <FileDown size={14} className="inline-block" /> Export
            </button>
            <button
              type="button"
              onClick={onToggleFavorite}
              className={`inline-flex items-center gap-1 rounded-2xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition cursor-pointer ${
                isFavorite
                  ? "border-yellow-400 bg-yellow-100 text-yellow-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Star size={14} />
              {isFavorite ? "Uloženo" : "Uložit"}
            </button>
          </div>
        </div>

        <h2 className="text-3xl font-bold leading-tight text-slate-900">
          {featureTitle}
        </h2>
        {description ? (
          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
        ) : null}
      </header>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <h3 className="text-xs uppercase tracking-wide text-slate-500">
          Základní informace
        </h3>
        <ul className="space-y-2 text-slate-600">
          {municipality ? (
            <li>
              <span className="font-semibold text-slate-800">Obec:</span>{" "}
              {municipality}
            </li>
          ) : null}
          {district ? (
            <li>
              <span className="font-semibold text-slate-800">Okres:</span>{" "}
              {district}
            </li>
          ) : null}
          {region ? (
            <li>
              <span className="font-semibold text-slate-800">Region:</span>{" "}
              {region}
            </li>
          ) : null}
          {length ? (
            <li>
              <span className="font-semibold text-slate-800">Délka:</span>{" "}
              {length}
            </li>
          ) : null}
          {categoryHint ? (
            <li>
              <span className="font-semibold text-slate-800">Typ:</span>{" "}
              {categoryHint}
            </li>
          ) : null}
          {phone ? (
            <li>
              <span className="font-semibold text-slate-800">Telefon:</span>{" "}
              <a href={`tel:${phone}`} className="text-emerald-600 underline">
                {phone}
              </a>
            </li>
          ) : null}
          {website ? (
            <li>
              <span className="font-semibold text-slate-800">Web:</span>{" "}
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Otevřít stránky
              </a>
            </li>
          ) : null}
          {typeof nearestDistance === "number" ? (
            <li>
              <span className="font-semibold text-slate-800">
                Vzdálenost od vás:
              </span>{" "}
              {nearestDistance.toFixed(1)} km
            </li>
          ) : null}
          <li className="text-xs text-slate-400">
            ID záznamu: {getFeatureId(feature)}
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <header className="flex items-center gap-3">
          <Wand2 size={18} className="text-emerald-500" />
          <div>
            <h3 className="text-xs uppercase tracking-wide text-slate-500">
              Doporučujeme navštívit
            </h3>
            <p className="text-xs text-slate-400">
              Výběr podobných míst ve stejném okrese nebo kategorii.
            </p>
          </div>
        </header>
        {recommendations.length === 0 ? (
          <p className="text-xs text-slate-500">
            Žádné další tipy pro tuto lokalitu jsme zatím nenašli.
          </p>
        ) : (
          <ul className="space-y-2">
            {recommendations.map((item) => (
              <li key={`${item.layerId}:${item.id}`}>
                <button
                  type="button"
                  onClick={() => onSelectRecommendation(item.layerId, item.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.layerTitle}
                      {item.district ? ` - ${item.district}` : ""}
                      {typeof item.distanceKm === "number"
                        ? ` - ${item.distanceKm.toFixed(1)} km`
                        : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-600 transition">
                    Otevřít
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs uppercase tracking-wide text-slate-500">
            Najdi města v okolí
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex-1 text-xs uppercase tracking-wide text-slate-500">
            Poloměr (km)
            <input
              type="number"
              min={5}
              step={1}
              value={radiusKm}
              onChange={(event) => setRadiusKm(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 cursor-pointer disabled:cursor-not-allowed disabled:bg-emerald-900/60 disabled:text-emerald-200/60"
            disabled={nearbyLoading}
          >
            Vyhledat
          </button>
        </form>

        {nearbyError ? (
          <p className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600">
            {nearbyError}
          </p>
        ) : null}

        {nearbyLoading ? (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={14} /> Hledám města v okruhu {radiusKm} km...
          </p>
        ) : nearby && nearby.length > 0 ? (
          <ul className="space-y-2">
            {nearby.map((city) => (
              <li
                key={city.name}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{city.name}</p>
                  <p className="text-xs text-slate-500">
                    Obyvatel: {new Intl.NumberFormat("cs-CZ").format(city.population)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">
                  {city.distanceKm} km
                </span>
              </li>
            ))}
          </ul>
        ) : nearby ? (
          <p className="text-xs text-slate-500">
            V zadaném okruhu jsme nenašli žádné město z demo dat.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Zadejte poloměr a získejte tipy na větší města v okolí pro doprovodný program.
          </p>
        )}
      </section>
    </motion.aside>
  );
}
