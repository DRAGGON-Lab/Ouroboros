import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CircularDnaScroller, { buildCircularTrack, parseSelectionInput } from "./CircularDnaScroller";

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

describe("parseSelectionInput", () => {
  it("parses a single position", () => {
    expect(parseSelectionInput("1,622 / 4,033", 4033)).toEqual({ start: 1622, end: 1622 });
  });

  it("parses and normalizes a range", () => {
    expect(parseSelectionInput("1,640-1,622/4,033", 4033)).toEqual({ start: 1622, end: 1640 });
  });
});

describe("CircularDnaScroller", () => {
  it("routes vertical wheel events to DNA movement", () => {
    render(<CircularDnaScroller sequence="ACGTACGT" annotations={[]} />);

    const viewport = screen.getByLabelText("dna-viewport");
    const positionLabelBefore = document.querySelector(".dnaScrollerHeader strong")?.textContent;

    fireEvent.wheel(viewport, { deltaY: 80 });

    expect(document.querySelector(".dnaScrollerHeader strong")?.textContent).not.toEqual(positionLabelBefore);
  });

  it("supports selecting a linear range by dragging", () => {
    render(<CircularDnaScroller sequence={"ACGT".repeat(60)} annotations={[]} />);

    const base10 = screen.getByLabelText("base-10");
    const base14 = screen.getByLabelText("base-14");

    fireEvent.mouseDown(base10);
    fireEvent.mouseEnter(base14, { buttons: 1 });
    fireEvent.mouseUp(base14);

    expect(screen.getByText("10-14 / 240")).toBeInTheDocument();
  });

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
