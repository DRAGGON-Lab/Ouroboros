import { afterEach, describe, expect, it, vi } from "vitest";

import { buildVisibleWindow, getVisibleSliceIndexes, loadViewerPayload } from "./api";
import type { ViewerWindowResponse } from "../../shared/types/ts";

const createWindowResponse = (overrides: Partial<ViewerWindowResponse> = {}): ViewerWindowResponse => ({
  sequenceId: "NC_000913.3",
  genomeLength: 4_641_652,
  requestedCenter: 1_000,
  visibleStart: 500,
  visibleEnd: 1_499,
  fetchStart: 250,
  fetchEnd: 1_749,
  visibleLength: 1_000,
  bufferLeft: 250,
  bufferRight: 250,
  bases: "A".repeat(1_500),
  forwardFn: "P".repeat(1_500),
  reverseFn: "C".repeat(1_500),
  forwardActivity: Array.from({ length: 1_500 }, (_, index) => index),
  reverseActivity: Array.from({ length: 1_500 }, (_, index) => index + 0.5),
  ...overrides
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getVisibleSliceIndexes", () => {
  it("derives inclusive visible coordinates into zero-based fetch-relative indexes", () => {
    expect(getVisibleSliceIndexes(500, 1_499, 250)).toEqual({
      startIndex: 250,
      endIndexExclusive: 1_250
    });
  });

  it("clips impossible ranges to an empty slice boundary", () => {
    expect(getVisibleSliceIndexes(100, 90, 50)).toEqual({
      startIndex: 50,
      endIndexExclusive: 50
    });
  });
});

describe("buildVisibleWindow", () => {
  it("slices buffer arrays and compact strings down to visible-only values", () => {
    const payload = createWindowResponse({
      visibleStart: 1,
      visibleEnd: 5,
      fetchStart: 1,
      bases: "ACGTN---",
      forwardFn: "PC-PC---",
      reverseFn: "CPC-P---",
      forwardActivity: [1, 2, 3, 4, 5, 6, 7, 8],
      reverseActivity: [8, 7, 6, 5, 4, 3, 2, 1]
    });

    expect(buildVisibleWindow(payload)).toEqual({
      visibleBases: "ACGTN",
      visibleForwardFn: "PC-PC",
      visibleReverseFn: "CPC-P",
      visibleForwardActivity: [1, 2, 3, 4, 5],
      visibleReverseActivity: [8, 7, 6, 5, 4]
    });
  });
});

describe("loadViewerPayload", () => {
  it("calls viewer window endpoint with accession and center query params", async () => {
    const mockResponse = createWindowResponse();
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    vi.stubGlobal("fetch", fetchSpy);

    await loadViewerPayload("NC_000913.3", 1_000);

    expect(fetchSpy).toHaveBeenCalledWith("http://localhost/api/v1/viewer/window?accession=NC_000913.3&center=1000");
  });

  it("returns shape compatible with compact backend response and visible-only slices", async () => {
    const mockResponse = createWindowResponse({
      visibleStart: 4_640_653,
      visibleEnd: 4_641_652,
      fetchStart: 4_640_403,
      fetchEnd: 4_641_652,
      bases: "A".repeat(1_250),
      forwardFn: "P".repeat(1_250),
      reverseFn: "C".repeat(1_250),
      forwardActivity: Array.from({ length: 1_250 }, () => 0.1),
      reverseActivity: Array.from({ length: 1_250 }, () => 0.9)
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })
    );

    const payload = await loadViewerPayload("U00096.3", 4_641_500);

    expect(payload).toMatchObject({
      accession: "NC_000913.3",
      region: {
        start: 4_640_653,
        end: 4_641_652,
        center: 1_000
      },
      fetchRange: {
        start: 4_640_403,
        end: 4_641_652
      },
      visibleLength: 1_000,
      bufferLeft: 250,
      bufferRight: 250
    });
    expect(payload.visibleBases).toHaveLength(1_000);
    expect(payload.visibleForwardFn).toHaveLength(1_000);
    expect(payload.visibleReverseFn).toHaveLength(1_000);
    expect(payload.visibleForwardActivity).toHaveLength(1_000);
    expect(payload.visibleReverseActivity).toHaveLength(1_000);
    expect((payload as unknown as { features?: unknown }).features).toBeUndefined();
    expect((payload as unknown as { nucleotides?: unknown }).nucleotides).toBeUndefined();
  });
});
