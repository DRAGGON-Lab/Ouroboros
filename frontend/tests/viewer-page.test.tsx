import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import ViewerPage from "../app/viewer/page";

vi.mock("seqviz", () => ({
  __esModule: true,
  default: ({ viewer }: { viewer: string }) => <div data-testid={`seqviz-${viewer}`}>SeqViz</div>
}));

describe("/viewer page", () => {
  it("renders seqviz layout sections", async () => {
    render(<ViewerPage />);

    expect(screen.getByRole("heading", { name: /genome viewer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/circular-map-panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/linear-map-panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/linear-map-scroll-container/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/viewport-range/i).textContent).toMatch(/Range:/);
    });

    expect(screen.getByTestId("seqviz-circular")).toBeInTheDocument();
    expect(screen.getByTestId("seqviz-linear")).toBeInTheDocument();
  });
});
