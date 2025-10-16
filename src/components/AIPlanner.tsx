"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { CalendarRange, Loader2, Sparkles, FileDown } from "lucide-react";
import type { AIFeature } from "@/utils/aiUtils";
import {
  buildFriendlySummary,
  buildPlanNarrative,
  pickDistinct,
  pickRandom,
} from "@/utils/aiUtils";

type PlannerProps = {
  features: AIFeature[];
  onSelect: (feature: AIFeature) => void;
};

const PLAN_ORDER = [
  {
    label: "Dopoledne",
    emoji: "🟠",
    filter: (item: AIFeature) => item.layerId.includes("pamatky"),
  },
  {
    label: "Odpoledne",
    emoji: "🟢",
    filter: (item: AIFeature) =>
      item.layerId === "prirodni-zajimavosti" ||
      item.typeLabel.toLowerCase().includes("prirodni"),
  },
  {
    label: "Večer",
    emoji: "🔵",
    filter: (item: AIFeature) => item.layerId === "turisticke-regiony",
  },
];

export function AIPlanner({ features, onSelect }: PlannerProps) {
  const [plan, setPlan] = useState<AIFeature[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const planNarrative = useMemo(() => buildPlanNarrative(plan), [plan]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const showToast = (message: string, duration = 3200) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), duration);
  };

  const generatePlan = () => {
    setIsPlanning(true);
    setTimeout(() => {
      const availableCount = Math.min(3, features.length);
      if (availableCount === 0) {
        setPlan([]);
        setIsPlanning(false);
        return;
      }

      const picks: AIFeature[] = [];
      const usedIds = new Set<string>();

      const pushCandidate = (candidate: AIFeature | null) => {
        if (!candidate || usedIds.has(candidate.id)) return false;
        picks.push(candidate);
        usedIds.add(candidate.id);
        return true;
      };

      PLAN_ORDER.forEach(({ filter }) => {
        if (picks.length >= availableCount) return;
        const match = pickDistinct(features, (item) => filter(item) && !usedIds.has(item.id));
        pushCandidate(match);
      });

      const remainingPool = features.filter((item) => !usedIds.has(item.id));
      while (picks.length < availableCount && remainingPool.length > 0) {
        const next = pickRandom(remainingPool);
        if (!next) break;
        pushCandidate(next);
        remainingPool.splice(remainingPool.findIndex((i) => i.id === next.id), 1);
      }

      setPlan(picks.slice(0, availableCount));
      setIsPlanning(false);
    }, 700);
  };

  const handleExportPdf = async () => {
    if (plan.length === 0) {
      showToast("ℹ️ Nejprve vygenerujte plán.", 3600);
      return;
    }

    const doc = new jsPDF({
      unit: "pt",
      format: "a4",
    });

    // 🔹 Použij vestavěný font Helvetica, který funguje i v Next.js
    doc.setFont("helvetica", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 50;
    let y = 80;

    // Nadpis
    doc.setFontSize(20);
    doc.setTextColor(30, 30, 30);
    doc.text(decodeURIComponent(encodeURIComponent("KHK Explore – Můj denní plán")), pageWidth / 2, y, {
      align: "center",
    });

    y += 40;
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);

    // Sekce dne
    PLAN_ORDER.forEach((slot, index) => {
      const item = plan[index];
      if (!item) return;

      const title = `${slot.emoji} ${slot.label}: ${item.title}`;
      const desc =
        item.description && item.description.trim()
          ? item.description.replace(/\s+/g, " ").trim()
          : buildFriendlySummary(item);

      y += 25;
      if (y > 770) {
        doc.addPage();
        y = 80;
      }

      // Titulek
      doc.setFontSize(13);
      doc.setTextColor(33, 33, 33);
      doc.text(decodeURIComponent(encodeURIComponent(title)), margin, y);
      y += 16;

      // Popis
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      const cleanDesc = decodeURIComponent(encodeURIComponent(desc));
      const lines = doc.splitTextToSize(cleanDesc, pageWidth - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 14;
    });

    // Patička
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(
      decodeURIComponent(encodeURIComponent("Exportováno z aplikace KHK Explore © 2025")),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 40,
      { align: "center" }
    );

    doc.save("muj-den.pdf");
    showToast("✅ PDF bylo úspěšně vytvořeno.", 3600);
  };


  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-5 text-slate-900 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarRange size={20} className="text-emerald-500 flex-shrink-0" />
          <h2 className="truncate text-base sm:text-lg font-semibold text-slate-900 whitespace-nowrap">
            Naplánovat&nbsp;den
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generatePlan}
            disabled={isPlanning}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/40 transition hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPlanning ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Generuji...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generovat plán
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="export-toast"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200/80 bg-white/95 px-4 py-2 text-sm font-medium text-emerald-600 shadow-sm"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {plan.length === 0 ? (
          <motion.div
            key="hint"
            initial={{ opacity: 0.4, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-emerald-200/60 bg-white/95 px-4 py-3 text-sm text-emerald-700"
          >
            Klikněte na <b>„Generovat plán“</b> a AI vám sestaví výlet na celý den.
          </motion.div>
        ) : (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-600">Tvůj plán:</p>
              <motion.button
                key="pdf-bottom"
                onClick={handleExportPdf}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500 bg-white px-3 py-1 text-xs font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98]"
              >
                <FileDown size={14} />
                Exportovat PDF
              </motion.button>
            </div>

            <ul className="mt-2 space-y-2">
              {PLAN_ORDER.map((slot, index) => {
                const item = plan[index];
                if (!item) return null;
                const summary = planNarrative[index] ?? buildFriendlySummary(item);
                return (
                  <li
                    key={`${slot.label}-${item.id}`}
                    className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {slot.emoji} {slot.label}: {item.title}
                      </p>
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-emerald-950 cursor-pointer"
                      >
                        Zobrazit
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">{summary}</p>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
