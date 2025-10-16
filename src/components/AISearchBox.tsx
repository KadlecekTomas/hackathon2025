"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, Search, Sparkles } from "lucide-react";
import type { AIFeature } from "@/utils/aiUtils";

type AISearchBoxProps = {
  onSearch: (query: string) => Promise<AIFeature[]>;
  onSelect: (feature: AIFeature) => void;
};

const DEFAULT_HINT = `Zadejte dotaz: "Chci prirodni vylet u Trutnova"`;

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
        'Zadejte dotaz napr. "Kam na kolo v Broumovsku?" nebo "Chci vylet pro deti".',
      );
      return;
    }
    setIsThinking(true);
    setPlaceholder("AI premysli nad vasim dotazem...");
    const found = await onSearch(query.trim());
    setResults(found);
    setMessage(
      found.length === 0
        ? "Bohuzel jsem nenasla odpovidajici vylet. Zkuste upresnit oblast nebo typ aktivity."
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

  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const win = window as Window & {
      SpeechRecognition?: typeof window.SpeechRecognition;
      webkitSpeechRecognition?: typeof window.SpeechRecognition;
    };
    const SpeechRecognitionClass =
      win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setMessage("Prohlizec nepodporuje hlasove vyhledavani.");
      return;
    }
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "cs-CZ";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setPlaceholder("Nasloucham... mluvte prosim.");
      setMessage(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      void onSearch(transcript).then((found) => {
        setResults(found);
        setIsThinking(false);
        setMessage(
          found.length === 0
            ? "Hlasem jsem nic nenasla, zkuste dotaz upravit."
            : null,
        );
        resetPlaceholder();
      });
    };

    recognition.onerror = () => {
      setMessage("Hlasove vyhledavani se nezdarilo, zkuste to znovu.");
      resetPlaceholder();
    };

    recognition.onend = resetPlaceholder;

    recognition.start();
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
          <div className="pointer-events-none absolute inset-y-0 right-12 hidden items-center pr-3 text-slate-400 sm:flex">
            <Search size={16} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleVoiceSearch}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100"
          aria-label="Hlasove vyhledavani"
        >
          <Mic size={18} />
        </button>
        <button
          type="button"
          onClick={() => {
            playPing();
            void handleSearch();
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-900/40 disabled:text-emerald-100"
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
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
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
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-emerald-950"
                  >
                    Zobrazit na mape
                  </button>
                </div>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

  {!isThinking && results.length === 0 && (message || hasQuery) ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          {message ??
            'Zadejte dotaz a potvrzte jej enterem nebo tlacitkem "Vyhledat".'}
        </div>
      ) : null}
    </div>
  );
}
