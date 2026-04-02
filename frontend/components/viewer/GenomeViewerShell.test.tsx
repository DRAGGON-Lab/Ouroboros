import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GenomeViewerShell from "./GenomeViewerShell";

const { loadViewerSequenceMock } = vi.hoisted(() => ({
  loadViewerSequenceMock: vi.fn()
}));

vi.mock("../../features/viewer/api", () => ({
  loadViewerSequence: loadViewerSequenceMock
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    set: vi.fn()
  }
}));

vi.mock("gsap/dist/Draggable", () => ({
  Draggable: {
    create: vi.fn(() => [{ update: vi.fn(), kill: vi.fn() }])
  }
}));

describe("GenomeViewerShell", () => {
  it("falls back to example sequence when plasmid loading fails", async () => {
    loadViewerSequenceMock.mockRejectedValueOnce(new Error("network"));

    render(<GenomeViewerShell />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "example_plasmid" }
    });

    await waitFor(() => {
      expect(screen.getByText(/Could not load example plasmid/i)).toBeInTheDocument();
    });

    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("example_sequence");
  });
});
