"use client";

import React, { useMemo, useState } from "react";

import type { ViewerPayload } from "../../shared/types/ts";
import DnaCircularScroller from "./DnaCircularScroller";

interface SeqVizLayoutProps {
  accession: string;
  payload: ViewerPayload | null;
  selectedCoordinate: number;
}

const DNA_PATTERN = "ACGTGCCGTA";

const buildSequence = (payload: ViewerPayload | null): string => {
  if (!payload) {
    return DNA_PATTERN.repeat(400);
  }

  return payload.bases.length > 0 ? payload.bases : DNA_PATTERN.repeat(400);
};

export default function SeqVizLayout({ accession, payload, selectedCoordinate }: SeqVizLayoutProps) {
  const sequence = useMemo(() => buildSequence(payload), [payload]);
  const [centerCoordinate, setCenterCoordinate] = useState(selectedCoordinate);

  return (
    <section className="viewerShell" aria-label="genome-viewer-shell">
      <header className="viewerHeader viewerHeaderModern">
        <div>
          <h1>Ouroboros DNA Viewer</h1>
          <p>Accession: {accession}</p>
        </div>
        <p className="viewerMeta">
          Genome length: <strong>{sequence.length.toLocaleString()} bp</strong> · Display center: <strong>{centerCoordinate.toLocaleString()}</strong>
        </p>
      </header>

      <div className="viewerCanvas viewerCanvasModern" aria-label="dna-viewer-layout">
        <DnaCircularScroller
          sequence={sequence}
          initialCoordinate={selectedCoordinate}
          onCenterCoordinateChange={setCenterCoordinate}
        />
      </div>
    </section>
  );
}
