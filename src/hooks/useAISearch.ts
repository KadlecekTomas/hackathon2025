"use client";

import { useMemo } from "react";
import Fuse from "fuse.js";
import type { AIFeature } from "@/utils/aiUtils";

type UseAISearchArgs = {
  features: AIFeature[];
};

export function useAISearch({ features }: UseAISearchArgs) {
  const fuse = useMemo(() => {
    return new Fuse(features, {
      keys: [
        "title",
        "description",
        "region",
        "district",
        "categoryHint",
        "layerTitle",
        "typeLabel",
      ],
      threshold: 0.32,
      includeScore: true,
      ignoreLocation: true,
    });
  }, [features]);

  const search = (query: string) => {
    if (!query || query.trim().length === 0) return [] as AIFeature[];
    const results = fuse.search(query.trim()).slice(0, 3);
    return results.map((item) => item.item);
  };

  return { search };
}
