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
    render(<CircularDnaScroller sequence="ACGTACGT" />);
    screen.getByLabelText("dna-track");

    const callsBeforeWheel = gsapSet.mock.calls.length;
    fireEvent.wheel(window, { deltaX: 80 });

    expect(gsapSet.mock.calls.length).toBeGreaterThan(callsBeforeWheel);
  });
});
