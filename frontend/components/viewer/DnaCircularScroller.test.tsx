import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DnaCircularScroller from "./DnaCircularScroller";

describe("DnaCircularScroller", () => {
  it("renders repeated dna bases and current center position", () => {
    render(<DnaCircularScroller sequence="ACGT" initialCoordinate={3} />);

    expect(screen.getByLabelText(/dna-circular-scroller/i)).toBeInTheDocument();
    expect(screen.getByText(/center position/i)).toBeInTheDocument();
    expect(screen.getAllByText("A").length).toBeGreaterThan(1);
  });
});
