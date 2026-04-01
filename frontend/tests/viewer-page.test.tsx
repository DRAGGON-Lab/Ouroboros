import React from "react";
import { render, screen } from "@testing-library/react";

import ViewerPage from "../app/viewer/page";

describe("/viewer page", () => {
  it("renders the redesigned dna scroller layout", async () => {
    render(<ViewerPage />);

    expect(screen.getByRole("heading", { name: /ouroboros dna viewer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/dna-viewer-layout/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dna-circular-scroller/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dna-scroll-viewport/i)).toBeInTheDocument();
  });
});
