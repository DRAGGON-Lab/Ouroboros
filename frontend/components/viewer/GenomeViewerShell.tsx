"use client";

import React, { useMemo, useState } from "react";

import { loadViewerSequence } from "../../features/viewer/api";
import type { SequenceAnnotation, ViewerSequenceSource } from "../../shared/types/ts";
import CircularDnaScroller from "./CircularDnaScroller";

const EXAMPLE_SEQUENCE_SOURCE: ViewerSequenceSource = "example_sequence";
const EXAMPLE_PLASMID_SOURCE: ViewerSequenceSource = "example_plasmid";

const EXAMPLE_SEQUENCE_LENGTH = 1_011;
const DEFAULT_EXAMPLE_SEQUENCE = ("ACGT".repeat(Math.ceil(EXAMPLE_SEQUENCE_LENGTH / 4))).slice(0, EXAMPLE_SEQUENCE_LENGTH);

export default function GenomeViewerShell() {
  const [selectedSource, setSelectedSource] = useState<ViewerSequenceSource>(EXAMPLE_SEQUENCE_SOURCE);
  const [sequence, setSequence] = useState<string>(DEFAULT_EXAMPLE_SEQUENCE);
  const [annotations, setAnnotations] = useState<SequenceAnnotation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string>("");

  const sourceLabel = useMemo(() => {
    if (selectedSource === EXAMPLE_PLASMID_SOURCE) {
      return "Example plasmid";
    }

    return "Example sequence";
  }, [selectedSource]);

  const onSourceChange = async (nextSource: ViewerSequenceSource): Promise<void> => {
    setSelectedSource(nextSource);
    setLoadError("");

    if (nextSource === EXAMPLE_SEQUENCE_SOURCE) {
      setSequence(DEFAULT_EXAMPLE_SEQUENCE);
      setAnnotations([]);
      return;
    }

    setIsLoading(true);
    try {
      const payload = await loadViewerSequence(nextSource);
      setSequence(payload.sequence);
      setAnnotations(payload.annotations);
    } catch {
      setSelectedSource(EXAMPLE_SEQUENCE_SOURCE);
      setSequence(DEFAULT_EXAMPLE_SEQUENCE);
      setAnnotations([]);
      setLoadError("Could not load example plasmid from backend. Showing example sequence instead.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="viewerPageMain">
      <CircularDnaScroller
        sequence={sequence}
        annotations={annotations}
        sourceSelector={(
          <>
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
            <span className="dnaSourceStatus" aria-live="polite">
              {isLoading ? "Loading sequence..." : loadError || sourceLabel}
            </span>
          </>
        )}
      />
    </main>
  );
}
