import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LinearSequenceViewer from "./LinearSequenceViewer";

describe("LinearSequenceViewer", () => {
  it("renders forward and reverse base letters per column", () => {
    render(
      <LinearSequenceViewer
        bases="AC"
        forwardFn="-P"
        reverseFn="C-"
        forwardActivity={[1, 2]}
        reverseActivity={[0, 1]}
      />
    );

    expect(screen.getByTestId("forward-box-0")).toHaveTextContent("A");
    expect(screen.getByTestId("reverse-box-0")).toHaveTextContent("T");
    expect(screen.getByTestId("forward-box-1")).toHaveTextContent("C");
    expect(screen.getByTestId("reverse-box-1")).toHaveTextContent("G");
  });

  it("maps function code to border colors", () => {
    render(
      <LinearSequenceViewer
        bases="ATG"
        forwardFn="-PC"
        reverseFn="CP-"
        forwardActivity={[0, 0, 0]}
        reverseActivity={[0, 0, 0]}
      />
    );

    expect(screen.getByTestId("forward-box-0")).toHaveStyle({ borderColor: "#101828" });
    expect(screen.getByTestId("forward-box-1")).toHaveStyle({ borderColor: "#2e90fa" });
    expect(screen.getByTestId("forward-box-2")).toHaveStyle({ borderColor: "#12b76a" });
  });

  it("scales activity bars to pixel heights", () => {
    render(
      <LinearSequenceViewer
        bases="A"
        forwardFn="-"
        reverseFn="-"
        forwardActivity={[1]}
        reverseActivity={[2]}
      />
    );

    expect(screen.getByTestId("forward-bar-0")).toHaveStyle({ height: "20px" });
    expect(screen.getByTestId("reverse-bar-0")).toHaveStyle({ height: "40px" });
  });
});
