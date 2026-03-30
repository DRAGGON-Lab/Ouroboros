import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import ViewerPage from "../app/viewer/page";

describe("/viewer page", () => {
  it("renders viewer shell sections", async () => {
    render(<ViewerPage />);

    expect(screen.getByRole("heading", { name: /genome viewer/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/central-region-panel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/forward-track-lane/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reverse-track-lane/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/activity-track-area/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/viewport-range/i).textContent).toMatch(/Range:/);
    });
  });
});
