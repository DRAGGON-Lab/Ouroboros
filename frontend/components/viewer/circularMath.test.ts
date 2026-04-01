import { describe, expect, it } from "vitest";

import { buildDecileTicks, buildVisibleArc, positionToAngle } from "./circularMath";

describe("positionToAngle", () => {
  it("anchors position 1 at -90 degrees", () => {
    expect(positionToAngle(1, 1_000)).toBe(-90);
  });

  it("maps quarter-turn positions correctly", () => {
    expect(positionToAngle(251, 1_000)).toBe(0);
    expect(positionToAngle(501, 1_000)).toBe(90);
    expect(positionToAngle(751, 1_000)).toBe(180);
  });
});

describe("buildDecileTicks", () => {
  it("returns ticks for position 1 plus each 10 percent mark", () => {
    const ticks = buildDecileTicks(1_000);
    expect(ticks).toHaveLength(11);
    expect(ticks.map((tick) => tick.position)).toEqual([1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1_000]);
  });

  it("de-duplicates ticks for tiny genomes", () => {
    const ticks = buildDecileTicks(5);
    expect(ticks.map((tick) => tick.position)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("buildVisibleArc", () => {
  it("builds arc angles for non-wrapping windows", () => {
    const arc = buildVisibleArc(100, 300, 1_000);

    expect(arc.startAngleDeg).toBeCloseTo(-54.36, 2);
    expect(arc.spanAngleDeg).toBeCloseTo(72.36, 2);
    expect(arc.endAngleDeg).toBeCloseTo(18, 2);
  });

  it("preserves span for windows that wrap past origin", () => {
    const arc = buildVisibleArc(900, 100, 1_000);

    expect(arc.startAngleDeg).toBeCloseTo(233.64, 2);
    expect(arc.spanAngleDeg).toBeCloseTo(72.36, 2);
    expect(arc.endAngleDeg).toBeCloseTo(306, 2);
  });
});
