"use client";

import React, { useEffect, useMemo, useState, type CSSProperties } from "react";

import { loadViewerPayload } from "../../features/viewer/api";
import type { FeatureBlock, NucleotideBlock, ViewerPayload } from "../../shared/types/ts";

const DEFAULT_ACCESSION = "NC_000913.3";
const DEFAULT_COORDINATE = 235000;

const laneStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "10px",
  padding: "0.75rem",
  minHeight: "84px",
  background: "#ffffff"
};

const renderBlocks = (blocks: Array<NucleotideBlock | FeatureBlock>, emptyLabel: string) => {
  if (blocks.length === 0) {
    return <div>{emptyLabel}</div>;
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {blocks.map((block) => (
        <div
          key={block.id}
          style={{
            borderRadius: "8px",
            border: "1px solid #b2ddff",
            background: block.strand === "forward" ? "#eff8ff" : "#f5f3ff",
            padding: "0.5rem 0.75rem"
          }}
        >
          <strong>{block.label}</strong>
          <div>
            {block.start}-{block.end}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function GenomeViewerShell() {
  const [selectedCoordinate, setSelectedCoordinate] = useState<number>(DEFAULT_COORDINATE);
  const [payload, setPayload] = useState<ViewerPayload | null>(null);

  useEffect(() => {
    void loadViewerPayload(DEFAULT_ACCESSION, selectedCoordinate).then(setPayload);
  }, [selectedCoordinate]);

  const rangeLabel = useMemo(() => {
    if (!payload) {
      return "Loading region...";
    }

    return `${payload.region.start.toLocaleString()}-${payload.region.end.toLocaleString()} (center ${payload.region.center.toLocaleString()})`;
  }, [payload]);

  const forwardNucleotides = payload?.nucleotides.filter((block) => block.strand === "forward") ?? [];
  const reverseNucleotides = payload?.nucleotides.filter((block) => block.strand === "reverse") ?? [];
  const forwardFeatures = payload?.features.filter((block) => block.strand === "forward") ?? [];
  const reverseFeatures = payload?.features.filter((block) => block.strand === "reverse") ?? [];

  return (
    <main style={{ minHeight: "100vh", width: "100%", padding: "1.5rem" }}>
      <section
        aria-label="genome-viewer-shell"
        style={{
          display: "grid",
          gridTemplateRows: "auto auto auto auto",
          gap: "1rem",
          minHeight: "calc(100vh - 3rem)",
          background: "#f8fafc"
        }}
      >
        <header style={{ ...laneStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem" }}>Genome Viewer</h1>
            <p style={{ margin: "0.35rem 0 0" }}>Accession: {payload?.accession ?? DEFAULT_ACCESSION}</p>
          </div>
          <p aria-label="viewport-range" style={{ margin: 0 }}>
            Range: {rangeLabel}
          </p>
        </header>

        <section aria-label="central-region-panel" style={laneStyle}>
          <h2 style={{ marginTop: 0 }}>Central Region Panel</h2>
          <p>
            Selected coordinate is centered at <strong>{selectedCoordinate.toLocaleString()}</strong>.
          </p>
          <button type="button" onClick={() => setSelectedCoordinate((coordinate) => coordinate + 100)}>
            Shift center +100 bp
          </button>
        </section>

        <section aria-label="strand-tracks" style={{ display: "grid", gap: "0.75rem" }}>
          <div aria-label="forward-track-lane" style={laneStyle}>
            <h3 style={{ marginTop: 0 }}>Forward Strand Lane</h3>
            {renderBlocks([...forwardNucleotides, ...forwardFeatures], "No forward blocks")}
          </div>
          <div aria-label="reverse-track-lane" style={laneStyle}>
            <h3 style={{ marginTop: 0 }}>Reverse Strand Lane</h3>
            {renderBlocks([...reverseNucleotides, ...reverseFeatures], "No reverse blocks")}
          </div>
        </section>

        <section aria-label="activity-track-area" style={laneStyle}>
          <h3 style={{ marginTop: 0 }}>Activity Track (Reserved)</h3>
          <p style={{ marginBottom: 0 }}>Reserved for measured and predicted activity signals.</p>
        </section>
      </section>
    </main>
  );
}
