"use client";

import React, { useMemo, type CSSProperties } from "react";
import SeqViz, { type SeqVizProps } from "seqviz";

import type { ViewerPayload } from "../../shared/types/ts";

interface SeqVizLayoutProps {
  accession: string;
  payload: ViewerPayload | null;
  selectedCoordinate: number;
  onShiftCenter: (offset: number) => void;
}

const DNA_PATTERN = "ATGCCGTA";

const buildRegionSequence = (payload: ViewerPayload | null): string => {
  if (!payload) {
    return DNA_PATTERN.repeat(80);
  }

  const span = Math.max(
    400,
    Math.abs(payload.region.end - payload.region.start) + 1,
    Math.abs(payload.region.center - payload.region.start) * 2 + 1
  );

  return DNA_PATTERN.repeat(Math.ceil(span / DNA_PATTERN.length)).slice(0, span);
};

const createAnnotations = (payload: ViewerPayload | null): SeqVizProps["annotations"] => {
  if (!payload) {
    return [];
  }

  return payload.features.map((feature, index) => ({
    start: index * 80 + 20,
    end: index * 80 + 70,
    name: feature.label,
    direction: feature.strand === "forward" ? 1 : -1,
    color: feature.strand === "forward" ? "#2563eb" : "#7c3aed"
  }));
};

const circularStyle: CSSProperties = {
  width: "min(340px, 42vw)",
  minWidth: "260px",
  height: "min(340px, 42vw)",
  backgroundColor: "#ffffff",
  border: "1px solid #d0d5dd",
  borderRadius: "12px",
  padding: "0.75rem",
  boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)"
};

const linearStyle: CSSProperties = {
  width: "1200px",
  minHeight: "260px",
  backgroundColor: "#ffffff",
  border: "1px solid #d0d5dd",
  borderRadius: "12px",
  padding: "0.75rem",
  boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)"
};

export default function SeqVizLayout({ accession, payload, selectedCoordinate, onShiftCenter }: SeqVizLayoutProps) {
  const sequence = useMemo(() => buildRegionSequence(payload), [payload]);
  const annotations = useMemo(() => createAnnotations(payload), [payload]);

  return (
    <section className="viewerShell" aria-label="genome-viewer-shell">
      <header className="viewerHeader">
        <div>
          <h1>Genome Viewer</h1>
          <p>Accession: {accession}</p>
        </div>
        <div className="viewerControls">
          <p aria-label="viewport-range">
            Range: {payload ? `${payload.region.start.toLocaleString()}-${payload.region.end.toLocaleString()}` : "Loading..."}
          </p>
          <p>
            Center: <strong>{selectedCoordinate.toLocaleString()}</strong>
          </p>
          <div>
            <button type="button" onClick={() => onShiftCenter(-100)}>
              Shift -100 bp
            </button>
            <button type="button" onClick={() => onShiftCenter(100)}>
              Shift +100 bp
            </button>
          </div>
        </div>
      </header>

      <div className="viewerCanvas" aria-label="seqviz-layout-root">
        <div className="viewerCircular" aria-label="circular-map-panel">
          <SeqViz
            name={`${accession} circular`}
            seq={sequence}
            annotations={annotations}
            primers={[]}
            viewer="circular"
            showComplement={false}
            showIndex
            style={circularStyle}
          />
        </div>

        <div className="viewerLinearRegion" aria-label="linear-map-panel">
          <div className="viewerLinearScroll" aria-label="linear-map-scroll-container">
            <SeqViz
              name={`${accession} linear`}
              seq={sequence}
              annotations={annotations}
              primers={[]}
              viewer="linear"
              showComplement
              showIndex
              zoom={{ linear: 85 }}
              style={linearStyle}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
