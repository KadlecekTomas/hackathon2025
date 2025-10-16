"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Compass, Info, Sparkles } from "lucide-react";
import type { AIFeature } from "@/utils/aiUtils";

type AITipsPanelProps = {
  tips: AIFeature[];
  onSelect: (feature: AIFeature) => void;
  isLoading?: boolean;
  message?: string | null;
};

export function AITipsPanel({ tips, onSelect, isLoading = false, message }: AITipsPanelProps) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 text-slate-900 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-500" />
          <h2 className="text-lg font-semibold">AI doporucuje</h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0.4, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"
          >
            <Compass className="animate-spin" size={16} />
            AI premysli nad tim, kam vas poslat?
          </motion.div>
        ) : tips.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0.4, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500"
          >
            <p>
              {message ??
                "Zadejte, co vas zajima, a AI vam doporuci vylet na miru."}
            </p>
            <p className="text-xs text-slate-400">
              Napriklad: &quot;Kde najdu klidnou trasu s vyhledem?&quot;
            </p>
          </motion.div>
        ) : (
          <motion.ul
            key="tips"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {tips.map((tip) => (
              <li key={tip.id}>
                <button
                  type="button"
                  onClick={() => onSelect(tip)}
                  className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {tip.title}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-emerald-600">
                        {tip.typeLabel}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                      Zobrazit
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-500">
                    {tip.description}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {tip.district ? <span>Okres {tip.district}</span> : null}
                    {tip.region ? <span>{tip.region}</span> : null}
                    <span>{tip.layerTitle}</span>
                  </div>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <Info size={14} />
        AI navrhy vychazeji z aktualnich filtru a dat Kralovehradeckeho kraje.
      </div>
    </section>
  );
}
