import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import ViewerPage from "../app/viewer/page";

vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    set: vi.fn()
  }
}));

vi.mock("gsap/Draggable", () => ({
  Draggable: {
    create: vi.fn(() => [{ kill: vi.fn() }])
  }
}));

describe("/viewer page", () => {
  it("renders the circular DNA scrolling experience", () => {
    render(<ViewerPage />);

    expect(screen.getByRole("heading", { name: /dna viewer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/dna-scroller/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dna-viewport/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dna-track/i)).toBeInTheDocument();
    expect(screen.getByText(/circular sequence/i)).toBeInTheDocument();
  });
});
