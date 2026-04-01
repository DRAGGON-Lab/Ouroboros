import React from "react";
import { render, screen } from "@testing-library/react";

import ViewerPage from "../app/viewer/page";

describe("ViewerPage", () => {
  it("renders the redesigned dna viewer heading and viewport", async () => {
    render(<ViewerPage />);
    expect(screen.getByRole("heading", { name: /ouroboros dna viewer/i })).toBeInTheDocument();
    expect(await screen.findByLabelText(/dna-scroll-viewport/i)).toBeInTheDocument();
  });
});
