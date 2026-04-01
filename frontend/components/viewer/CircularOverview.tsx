import React, { useMemo } from "react";

import { buildDecileTicks, buildVisibleArc } from "./circularMath";

interface CircularOverviewProps {
  genomeLength: number;
  visibleStart: number;
  visibleEnd: number;
  size?: number;
}

const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
};

const buildArcPath = (cx: number, cy: number, radius: number, startAngleDeg: number, spanAngleDeg: number) => {
  const start = polarToCartesian(cx, cy, radius, startAngleDeg);
  const end = polarToCartesian(cx, cy, radius, startAngleDeg + spanAngleDeg);
  const largeArcFlag = spanAngleDeg > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

export default function CircularOverview({ genomeLength, visibleStart, visibleEnd, size = 190 }: CircularOverviewProps) {
  const ticks = useMemo(() => buildDecileTicks(genomeLength), [genomeLength]);
  const arc = useMemo(
    () => buildVisibleArc(visibleStart, visibleEnd, genomeLength),
    [visibleEnd, visibleStart, genomeLength]
  );

  const center = size / 2;
  const radius = size * 0.36;

  return (
    <div
      aria-label="circular-overview-panel"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        border: "1px solid #d0d5dd",
        background: "#ffffff",
        boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
        padding: 10
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" role="img" aria-label="Genome circular overview">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#101828" strokeWidth={2} />

        {ticks.map((tick) => {
          const outer = polarToCartesian(center, center, radius + 5, tick.angleDeg);
          const inner = polarToCartesian(center, center, radius - 5, tick.angleDeg);

          return (
            <line
              key={`tick-${tick.position}`}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke="#344054"
              strokeWidth={1.5}
            />
          );
        })}

        <path d={buildArcPath(center, center, radius, arc.startAngleDeg, arc.spanAngleDeg)} fill="none" stroke="#2e90fa" strokeWidth={5} strokeLinecap="round" />
      </svg>
    </div>
  );
}
