import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CircularDnaScroller, { buildCircularTrack } from "./CircularDnaScroller";

const { gsapSet } = vi.hoisted(() => ({
  gsapSet: vi.fn()
}));

vi.mock("gsap/dist/gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    set: gsapSet
  }
}));

vi.mock("gsap/dist/Draggable", () => ({
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

  it("inverts vertical wheel direction so scroll down moves opposite of previous behavior", () => {
    render(<CircularDnaScroller sequence="ACGTACGT" annotations={[]} />);
    screen.getByLabelText("dna-track");

    const xBefore = (gsapSet.mock.calls.at(-1)?.[1] as { x: number }).x;
    fireEvent.wheel(window, { deltaY: 80 });
    const xAfter = (gsapSet.mock.calls.at(-1)?.[1] as { x: number }).x;

    expect(xAfter).toBeGreaterThan(xBefore);
  });

  it("inverts horizontal wheel direction so scroll left moves opposite of previous behavior", () => {
    render(<CircularDnaScroller sequence="ACGTACGT" annotations={[]} />);
    screen.getByLabelText("dna-track");

    const xBefore = (gsapSet.mock.calls.at(-1)?.[1] as { x: number }).x;
    fireEvent.wheel(window, { deltaX: -80 });
    const xAfter = (gsapSet.mock.calls.at(-1)?.[1] as { x: number }).x;

    expect(xAfter).toBeGreaterThan(xBefore);
  });



  it("updates linear position when dragging on the circular selection window", () => {
    render(<CircularDnaScroller sequence="ACGTACGT" annotations={[]} />);

    const circularTrack = screen.getByLabelText("dna-circular-track");
    vi.spyOn(circularTrack, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      toJSON: () => ({})
    } as DOMRect);

    expect(screen.getByText(/position/i)).toHaveTextContent("position 1 / 8");

    fireEvent.mouseDown(circularTrack, { clientX: 200, clientY: 100 });
    fireEvent.mouseMove(circularTrack, { clientX: 200, clientY: 100 });
    fireEvent.mouseUp(circularTrack);

    expect(screen.getByText(/position/i)).toHaveTextContent("position 3 / 8");
  });

  it("renders a circular DNA track with a visible-range overlay", () => {
    render(<CircularDnaScroller sequence="ACGTACGT" annotations={[]} />);

    const circularTrack = screen.getByLabelText("dna-circular-track");
    expect(circularTrack).toBeInTheDocument();
    expect(circularTrack.querySelector(".dnaCircularSelectionArc")).toBeTruthy();
  });
});


describe("feature highlighting", () => {
  it("colors promoter regions on the top border", () => {
    render(
      <CircularDnaScroller
        sequence="ACGTACGT"
        annotations={[{
          id: "promoter_1",
          type: "promoter",
          label: "promoter_match_1",
          start: 2,
          end: 3,
          strand: "forward",
          annotation_source: "inferred",
          activity_type: "predicted"
        }]}
      />
    );

    const track = screen.getByLabelText("dna-track");
    const spans = track.querySelectorAll("span.dnaBase");
    expect((spans[1] as HTMLSpanElement).style.borderTopColor).toBe("rgb(46, 144, 250)");
  });

  it("renders forward-strand feature coloring on the circular top strand", () => {
    render(
      <CircularDnaScroller
        sequence="ACGTACGT"
        annotations={[{
          id: "cds_forward_1",
          type: "CDS",
          label: "cds_match_1",
          start: 1,
          end: 4,
          strand: "forward",
          annotation_source: "inferred",
          activity_type: "predicted"
        }]}
      />
    );

    const circularTrack = screen.getByLabelText("dna-circular-track");
    const featureArc = circularTrack.querySelector(".dnaCircularFeatureArc") as SVGPathElement | null;
    expect(featureArc).toBeTruthy();
    expect(featureArc?.style.stroke).toBe("#12b76a");
  });
});
