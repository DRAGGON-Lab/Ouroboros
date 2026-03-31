import React from "react";
import { render, screen } from "@testing-library/react";

import Home from "../app/page";

describe("Home page", () => {
  it("renders the Ouroboros logo and viewer link", () => {
    render(<Home />);

    expect(screen.getByAltText(/ouroboros logotype/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to viewer/i })).toHaveAttribute("href", "/viewer");
  });
});
