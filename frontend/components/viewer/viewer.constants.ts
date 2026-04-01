import type { BaseCode, FunctionCode } from "../../shared/types/ts";

export const ACTIVITY_MAX = 2;
export const ACTIVITY_BAR_MAX_PX = 40;

export const FUNCTION_BORDER_COLORS: Record<FunctionCode, string> = {
  "-": "#101828",
  P: "#2e90fa",
  C: "#12b76a"
};

export const BASE_FILL_COLORS: Record<BaseCode, string> = {
  A: "rgba(18, 183, 106, 0.24)",
  C: "rgba(46, 144, 250, 0.24)",
  G: "rgba(250, 176, 5, 0.28)",
  T: "rgba(240, 68, 56, 0.24)",
  "-": "transparent"
};
