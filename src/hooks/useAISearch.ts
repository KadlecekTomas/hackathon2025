"use client";

import { useMemo } from "react";
import Fuse from "fuse.js";
import type { AIFeature } from "@/utils/aiUtils";
import {
  normalizeForSearch,
  tokenize,
  SEARCH_STOP_WORDS,
} from "@/utils/aiUtils";

type UseAISearchArgs = {
  features: AIFeature[];
};

const MAX_RESULTS = 5;

function prepareQuery(raw: string): string {
  const normalizedTokens = tokenize(raw);
  if (normalizedTokens.length === 0) return normalizeForSearch(raw);

  const filteredTokens = normalizedTokens.filter(
    (token) => !SEARCH_STOP_WORDS.has(token),
  );
  if (filteredTokens.length === 0) {
    return normalizedTokens.join(" ");
  }
  return filteredTokens.join(" ");
}

export function useAISearch({ features }: UseAISearchArgs) {
  const fuse = useMemo(() => {
    return new Fuse(features, {
      keys: [
        { name: "title", weight: 0.34 },
        { name: "searchText", weight: 0.28 },
        { name: "description", weight: 0.12 },
        { name: "keywords", weight: 0.1 },
        { name: "typeLabel", weight: 0.06 },
        { name: "layerTitle", weight: 0.05 },
        { name: "categoryHint", weight: 0.03 },
        { name: "region", weight: 0.01 },
        { name: "district", weight: 0.01 },
      ],
      threshold: 0.38,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true,
      minMatchCharLength: 2,
      fieldNormWeight: 0.4,
    });
  }, [features]);

  const search = (query: string): AIFeature[] => {
    if (!query || query.trim().length === 0) return [];
    const preparedQuery = prepareQuery(query.trim());
    let results = fuse.search(preparedQuery);

    if (results.length === 0 && preparedQuery !== normalizeForSearch(query)) {
      results = fuse.search(normalizeForSearch(query));
    }
    if (results.length === 0) {
      results = fuse.search(query.trim());
    }

    return results.slice(0, MAX_RESULTS).map((item) => item.item);
  };

  return { search };
}
