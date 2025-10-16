"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, Sparkles } from "lucide-react";
import type { AIFeature } from "@/utils/aiUtils";

type AISearchBoxProps = {
  onSearch: (query: string) => Promise<AIFeature[]>;
  onSelect: (feature: AIFeature) => void;
};

const DEFAULT_HINT = `Zadejte dotaz: "Chci přírodní výlet u Trutnova"`;

export function AISearchBox({ onSearch, onSelect }: AISearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AIFeature[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [placeholder, setPlaceholder] = useState(DEFAULT_HINT);
  const [message, setMessage] = useState<string | null>(null);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  const resetPlaceholder = () => setPlaceholder(DEFAULT_HINT);

  const handleSearch = async () => {
    if (!hasQuery) {
      setResults([]);
      setMessage(
        'Zadejte dotaz např. "Kam na kolo v Broumovsku?" nebo "Chci výlet pro děti".',
      );
      return;
    }
    setIsThinking(true);
    setPlaceholder("AI přemýšlí nad vaším dotazem...");
    const found = await onSearch(query.trim());
    setResults(found);
    setMessage(
      found.length === 0
        ? "Bohužel jsem nenašla odpovídající výlet. Zkuste upřesnit oblast nebo typ aktivity."
        : null,
    );
    setIsThinking(false);
    resetPlaceholder();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSearch();
    }
  };

  const playPing = () => {
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
    } catch {
      // ignorujeme chyby AudioContextu (napr. autoplay policy)
    }
  };

  return (
    <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
          />
          <div className="pointer-events-none absolute inset-y-0 right-3 hidden items-center pr-3 text-slate-400 sm:flex">
            <Search size={16} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            playPing();
            void handleSearch();
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 cursor-pointer disabled:cursor-not-allowed disabled:bg-emerald-900/40 disabled:text-emerald-100"
          disabled={isThinking}
        >
          {isThinking ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Analyzuji...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Vyhledat
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            {results.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400/60 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-emerald-600">
                      {item.typeLabel}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500">{item.description}</p>
                <div className="flex gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {item.district ? <span>Okres {item.district}</span> : null}
                  {item.region ? <span>{item.region}</span> : null}
                  <span>{item.layerTitle}</span>
                </div>
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!isThinking && results.length === 0 && (message || hasQuery) ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          {message ??
            'Zadejte dotaz a potvrďte jej enterem nebo tlačítkem "Vyhledat".'}
        </div>
      ) : null}
    </div>
  );
}
