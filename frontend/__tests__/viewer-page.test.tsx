import React from "react";
import { render, screen } from "@testing-library/react";
import ViewerPage from "../app/viewer/page";

describe("ViewerPage", () => {
  it("renders the genome viewer heading", async () => {
    render(<ViewerPage />);
    expect(screen.getByRole("heading", { name: /genome viewer/i })).toBeInTheDocument();
    expect(await screen.findByLabelText(/viewport-range/i)).toBeInTheDocument();
  });
});
