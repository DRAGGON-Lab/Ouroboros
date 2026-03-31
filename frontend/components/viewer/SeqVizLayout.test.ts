import { describe, expect, it } from "vitest";

import { calculateRegionSpan } from "./SeqVizLayout";
import type { ViewerPayload } from "../../shared/types/ts";

const buildPayload = (overrides: Partial<ViewerPayload> = {}): ViewerPayload => ({
  accession: "NC_000913.3",
  genomeLength: 4_641_652,
  region: {
    start: 1_000,
    center: 1_250,
    end: 1_500
  },
  nucleotides: [],
  features: [],
  ...overrides
});

describe("calculateRegionSpan", () => {
  it("uses direct span for non-wrapping regions", () => {
    const payload = buildPayload();
    expect(calculateRegionSpan(payload)).toBe(501);
  });

  it("handles circular wraparound without inflating span", () => {
    const payload = buildPayload({
      region: {
        start: 4_641_500,
        center: 97,
        end: 347
      }
    });
    expect(calculateRegionSpan(payload)).toBe(500);
  });
});
