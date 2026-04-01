import { describe, expect, it } from "vitest";

import { buildCircularTrack } from "./CircularDnaScroller";

describe("buildCircularTrack", () => {
  it("builds a repeated track with three circular copies", () => {
    const track = buildCircularTrack("ACGT");

    expect(track.length % 3).toBe(0);
    const oneLoop = track.length / 3;
    expect(track.slice(0, oneLoop)).toEqual(track.slice(oneLoop, oneLoop * 2));
    expect(track.slice(oneLoop, oneLoop * 2)).toEqual(track.slice(oneLoop * 2));
  });

  it("falls back to placeholder sequence when input is empty", () => {
    const track = buildCircularTrack("   ");

    expect(track.length).toBeGreaterThan(0);
    expect(track.includes("A")).toBe(true);
  });
});
