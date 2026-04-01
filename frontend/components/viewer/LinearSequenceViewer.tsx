import React from "react";

import type { BaseCode, FunctionCode } from "../../shared/types/ts";
import {
  ACTIVITY_BAR_MAX_PX,
  ACTIVITY_MAX,
  BASE_FILL_COLORS,
  FUNCTION_BORDER_COLORS
} from "./viewer.constants";

export interface LinearSequenceViewerProps {
  bases: string;
  forwardFn: string;
  reverseFn: string;
  forwardActivity: number[];
  reverseActivity: number[];
}

const COMPLEMENT: Record<BaseCode, BaseCode> = {
  A: "T",
  C: "G",
  G: "C",
  T: "A",
  "-": "-"
};

const toBaseCode = (base: string): BaseCode => (base in COMPLEMENT ? (base as BaseCode) : "-");

const toFunctionCode = (code: string): FunctionCode => (code === "P" || code === "C" || code === "-" ? code : "-");

const activityToPixels = (activity: number): number => {
  const clamped = Math.max(0, Math.min(ACTIVITY_MAX, Number.isFinite(activity) ? activity : 0));
  return (clamped / ACTIVITY_MAX) * ACTIVITY_BAR_MAX_PX;
};

export default function LinearSequenceViewer({
  bases,
  forwardFn,
  reverseFn,
  forwardActivity,
  reverseActivity
}: LinearSequenceViewerProps) {
  return (
    <div className="linearSequenceViewer" aria-label="linear-sequence-viewer">
      {Array.from(bases).map((base, index) => {
        const forwardBase = toBaseCode(base);
        const reverseBase = COMPLEMENT[forwardBase];
        const forwardFunction = toFunctionCode(forwardFn[index] ?? "-");
        const reverseFunction = toFunctionCode(reverseFn[index] ?? "-");
        const forwardBarHeight = activityToPixels(forwardActivity[index] ?? 0);
        const reverseBarHeight = activityToPixels(reverseActivity[index] ?? 0);

        return (
          <div
            className="linearBaseColumn"
            key={`${index}-${base}`}
            data-testid="base-column"
            style={{ width: `${100 / Math.max(1, bases.length)}%` }}
          >
            <div
              className="activityBar activityBarTop"
              data-testid={`forward-bar-${index}`}
              style={{ height: `${forwardBarHeight}px` }}
              aria-label={`forward-activity-${index}`}
            />
            <div
              className="baseBox"
              data-testid={`forward-box-${index}`}
              style={{
                borderColor: FUNCTION_BORDER_COLORS[forwardFunction],
                backgroundColor: BASE_FILL_COLORS[forwardBase]
              }}
              aria-label={`forward-base-${index}`}
            >
              {forwardBase}
            </div>

            <div
              className="baseBox"
              data-testid={`reverse-box-${index}`}
              style={{
                borderColor: FUNCTION_BORDER_COLORS[reverseFunction],
                backgroundColor: BASE_FILL_COLORS[reverseBase]
              }}
              aria-label={`reverse-base-${index}`}
            >
              {reverseBase}
            </div>
            <div
              className="activityBar activityBarBottom"
              data-testid={`reverse-bar-${index}`}
              style={{ height: `${reverseBarHeight}px` }}
              aria-label={`reverse-activity-${index}`}
            />
          </div>
        );
      })}
    </div>
  );
}
