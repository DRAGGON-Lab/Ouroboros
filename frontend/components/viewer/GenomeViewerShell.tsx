"use client";

import React, { useEffect, useState } from "react";

import { loadViewerPayload } from "../../features/viewer/api";
import type { ViewerPayload } from "../../shared/types/ts";
import SeqVizLayout from "./SeqVizLayout";

const DEFAULT_ACCESSION = "NC_000913.3";
const DEFAULT_COORDINATE = 235000;

export default function GenomeViewerShell() {
  const [selectedCoordinate, setSelectedCoordinate] = useState<number>(DEFAULT_COORDINATE);
  const [payload, setPayload] = useState<ViewerPayload | null>(null);

  useEffect(() => {
    void loadViewerPayload(DEFAULT_ACCESSION, selectedCoordinate).then(setPayload);
  }, [selectedCoordinate]);

  return (
    <main className="viewerPageMain">
      <SeqVizLayout
        accession={payload?.accession ?? DEFAULT_ACCESSION}
        payload={payload}
        selectedCoordinate={selectedCoordinate}
        onShiftCenter={(offset) => setSelectedCoordinate((coordinate) => coordinate + offset)}
      />
    </main>
  );
}
