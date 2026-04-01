"use client";

import React, { useMemo, useState } from "react";

import { loadViewerSequence } from "../../features/viewer/api";
import type { ViewerSequenceSource } from "../../shared/types/ts";
import CircularDnaScroller from "./CircularDnaScroller";

const EXAMPLE_SEQUENCE_SOURCE: ViewerSequenceSource = "example_sequence";
const EXAMPLE_PLASMID_SOURCE: ViewerSequenceSource = "example_plasmid";

const EXAMPLE_SEQUENCE_LENGTH = 1_011;
const DEFAULT_EXAMPLE_SEQUENCE = ("ACGT".repeat(Math.ceil(EXAMPLE_SEQUENCE_LENGTH / 4))).slice(0, EXAMPLE_SEQUENCE_LENGTH);

export default function GenomeViewerShell() {
  const [selectedSource, setSelectedSource] = useState<ViewerSequenceSource>(EXAMPLE_SEQUENCE_SOURCE);
  const [sequence, setSequence] = useState<string>(DEFAULT_EXAMPLE_SEQUENCE);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const sourceLabel = useMemo(() => {
    if (selectedSource === EXAMPLE_PLASMID_SOURCE) {
      return "Example plasmid";
    }

    return "Example sequence";
  }, [selectedSource]);

  const onSourceChange = async (nextSource: ViewerSequenceSource): Promise<void> => {
    setSelectedSource(nextSource);

    if (nextSource === EXAMPLE_SEQUENCE_SOURCE) {
      setSequence(DEFAULT_EXAMPLE_SEQUENCE);
      return;
    }

    setIsLoading(true);
    try {
      const payload = await loadViewerSequence(nextSource);
      setSequence(payload.sequence);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="viewerPageMain">
      <section className="viewerToolbar" aria-label="viewer-toolbar">
        <label htmlFor="sequence-source-select">Sequence</label>
        <select
          id="sequence-source-select"
          value={selectedSource}
          onChange={(event) => {
            void onSourceChange(event.target.value as ViewerSequenceSource);
          }}
        >
          <option value={EXAMPLE_SEQUENCE_SOURCE}>Example sequence (1011 bp)</option>
          <option value={EXAMPLE_PLASMID_SOURCE}>Example plasmid</option>
        </select>
        <p aria-live="polite">
          {isLoading ? "Loading sequence..." : `${sourceLabel} loaded · ${sequence.length.toLocaleString()} bp`}
        </p>
      </section>

      <CircularDnaScroller sequence={sequence} />
    </main>
  );
}
