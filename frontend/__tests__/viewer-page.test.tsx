import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import ViewerPage from "../app/viewer/page";

vi.mock("seqviz", () => ({
  __esModule: true,
  default: () => <div>SeqViz</div>
}));

describe("ViewerPage", () => {
  it("renders the genome viewer heading and range", async () => {
    render(<ViewerPage />);
    expect(screen.getByRole("heading", { name: /genome viewer/i })).toBeInTheDocument();
    expect(await screen.findByLabelText(/viewport-range/i)).toBeInTheDocument();
  });
});
