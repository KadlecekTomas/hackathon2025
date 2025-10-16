"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, Loader2, Sparkles } from "lucide-react";
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

const PLAN_ORDER: Array<{
  label: string;
  emoji: string;
  filter: (item: AIFeature) => boolean;
}> = [
  { label: "Dopoledne", emoji: "☀️", filter: (item) => item.layerId.includes("pamatky") },
  {
    label: "Odpoledne",
    emoji: "🌳",
    filter: (item) => item.layerId === "prirodni-zajimavosti" || item.typeLabel.toLowerCase().includes("prirodni"),
  },
  { label: "Vecer", emoji: "🗺️", filter: (item) => item.layerId === "turisticke-regiony" },
];

export function AIPlanner({ features, onSelect }: PlannerProps) {
  const [plan, setPlan] = useState<AIFeature[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);

  const planNarrative = useMemo(() => buildPlanNarrative(plan), [plan]);

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
        if (!candidate) return false;
        if (usedIds.has(candidate.id)) return false;
        picks.push(candidate);
        usedIds.add(candidate.id);
        return true;
      };

      PLAN_ORDER.forEach(({ filter }) => {
        if (picks.length >= availableCount) return;
        const match = pickDistinct(
          features,
          (item) => filter(item) && !usedIds.has(item.id),
        );
        pushCandidate(match);
      });

      const remainingPool = features.filter((item) => !usedIds.has(item.id));
      while (picks.length < availableCount && remainingPool.length > 0) {
        const next = pickRandom(remainingPool);
        if (!next) break;
        pushCandidate(next);
        const index = remainingPool.findIndex((item) => item.id === next.id);
        if (index >= 0) {
          remainingPool.splice(index, 1);
        }
      }

      setPlan(picks.slice(0, availableCount));
      setIsPlanning(false);
    }, 700);
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-5 text-slate-900 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarRange size={18} className="text-emerald-500" />
          <h2 className="text-lg font-semibold">Naplanovat den</h2>
        </div>
        <button
          type="button"
          onClick={generatePlan}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 cursor-pointer disabled:cursor-not-allowed disabled:bg-emerald-900/60 disabled:text-emerald-100"
          disabled={isPlanning}
        >
          {isPlanning ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Vymyslim...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generovat plan
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {plan.length === 0 ? (
          <motion.div
            key="hint"
            initial={{ opacity: 0.4, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-emerald-200/60 bg-white/95 px-4 py-3 text-sm text-emerald-700"
          >
            Kliknete na &quot;Generovat plan&quot; a AI sestavi vylet na cely den.
          </motion.div>
        ) : (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-3 rounded-2xl border border-emerald-200/60 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-inner shadow-emerald-100"
          >
            <p className="text-sm font-semibold text-emerald-600">Tvuj plan:</p>
            <ul className="space-y-2">
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
