import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CircularDnaScroller, { buildCircularTrack } from "./CircularDnaScroller";

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
  it("routes window vertical wheel events to DNA movement", () => {
    render(<CircularDnaScroller sequence="ACGTACGT" annotations={[]} />);
    const track = screen.getByLabelText("dna-track");

    const transformBefore = (track as HTMLDivElement).style.transform;
    fireEvent.wheel(window, { deltaY: 80 });

    expect((track as HTMLDivElement).style.transform).not.toEqual(transformBefore);
  });

  it("allows selecting a range using shift+click", () => {
    render(<CircularDnaScroller sequence={"ACGT".repeat(1200)} annotations={[]} />);

    const base1 = screen.getByRole("button", { name: "position-1" });
    fireEvent.click(base1);
    expect(screen.getByLabelText("position-indicator").textContent).toContain("position 1 / 4,800");

    const base20 = screen.getByRole("button", { name: "position-20" });
    fireEvent.click(base20, { shiftKey: true });

    expect(screen.getByLabelText("position-indicator").textContent).toContain("position 1-20 / 4,800");
  });
});

describe("feature highlighting", () => {
  it("colors promoter regions on the top border", () => {
    render(
      <CircularDnaScroller
        sequence="ACGTACGT"
        annotations={[
          {
            id: "promoter_1",
            type: "promoter",
            label: "promoter_match_1",
            start: 2,
            end: 3,
            strand: "forward",
            annotation_source: "inferred",
            activity_type: "predicted"
          }
        ]}
      />
    );

    const track = screen.getByLabelText("dna-track");
    const spans = track.querySelectorAll("span.dnaBase");
    expect((spans[1] as HTMLSpanElement).style.borderTopColor).toBe("rgb(46, 144, 250)");
  });
});
