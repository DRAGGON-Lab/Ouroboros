import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CircularDnaScroller, { buildCircularTrack } from "./CircularDnaScroller";

const { gsapSet } = vi.hoisted(() => ({
  gsapSet: vi.fn()
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    set: gsapSet
  }
}));

vi.mock("gsap/Draggable", () => ({
  Draggable: {
    create: vi.fn(() => [
      {
        update: vi.fn(),
        kill: vi.fn()
      }
    ])
  }
}));

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

describe("CircularDnaScroller", () => {
  it("routes window horizontal wheel events to DNA movement", () => {
    render(<CircularDnaScroller sequence="ACGTACGT" annotations={[]} />);
    screen.getByLabelText("dna-track");

    const callsBeforeWheel = gsapSet.mock.calls.length;
    fireEvent.wheel(window, { deltaX: 80 });

    expect(gsapSet.mock.calls.length).toBeGreaterThan(callsBeforeWheel);
  });

  it("renders annotation mini map labels", () => {
    render(
      <CircularDnaScroller
        sequence="ACGTACGT"
        annotations={[
          {
            id: "mock_promoter_1",
            type: "promoter",
            start: 1,
            end: 4,
            strand: "forward",
            label: "Promoter 1",
            annotation_source: "inferred",
            activity_type: "predicted"
          }
        ]}
      />
    );

    expect(screen.getByLabelText("feature-mini-map")).toBeInTheDocument();
    expect(screen.getByText("Promoter 1")).toBeInTheDocument();
  });
});
