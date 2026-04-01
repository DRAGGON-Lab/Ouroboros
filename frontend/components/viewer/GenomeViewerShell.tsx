"use client";

import React, { useEffect, useState } from "react";

import { loadViewerPayload } from "../../features/viewer/api";
import type { ViewerPayload } from "../../shared/types/ts";
import SeqVizLayout from "./SeqVizLayout";

const DEFAULT_ACCESSION = "NC_000913.3";
const DEFAULT_COORDINATE = 235000;

export default function GenomeViewerShell() {
  const [payload, setPayload] = useState<ViewerPayload | null>(null);

  useEffect(() => {
    void loadViewerPayload(DEFAULT_ACCESSION, DEFAULT_COORDINATE).then(setPayload);
  }, []);

  return (
    <main className="viewerPageMain">
      <SeqVizLayout
        accession={payload?.accession ?? DEFAULT_ACCESSION}
        payload={payload}
        selectedCoordinate={DEFAULT_COORDINATE}
      />
    </main>
  );
}
