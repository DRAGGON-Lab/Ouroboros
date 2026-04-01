"use client";

import React, { useEffect, useMemo, useState } from "react";

import { loadViewerPayload } from "../../features/viewer/api";
import type { ViewerPayload } from "../../shared/types/ts";
import CircularDnaScroller from "./CircularDnaScroller";

const DEFAULT_ACCESSION = "NC_000913.3";
const DEFAULT_COORDINATE = 1;

const FALLBACK_SEQUENCE = "ACGT".repeat(120);

const selectSequence = (payload: ViewerPayload | null): string => {
  if (!payload) {
    return FALLBACK_SEQUENCE;
  }

  return payload.bases || payload.visibleBases || FALLBACK_SEQUENCE;
};

export default function GenomeViewerShell() {
  const [payload, setPayload] = useState<ViewerPayload | null>(null);

  useEffect(() => {
    void loadViewerPayload(DEFAULT_ACCESSION, DEFAULT_COORDINATE).then(setPayload);
  }, []);

  const sequence = useMemo(() => selectSequence(payload), [payload]);

  return (
    <main className="viewerPageMain">
      <CircularDnaScroller sequence={sequence} />
    </main>
  );
}
