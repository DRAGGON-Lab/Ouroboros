export interface CircularTick {
  position: number;
  angleDeg: number;
}

export interface CircularArc {
  startAngleDeg: number;
  spanAngleDeg: number;
  endAngleDeg: number;
}

const DEFAULT_ANCHOR_DEG = -90;

const normalizePosition = (position: number, genomeLength: number): number => {
  if (genomeLength <= 0) {
    throw new Error("genomeLength must be greater than zero");
  }

  const zeroBased = ((Math.round(position) - 1) % genomeLength + genomeLength) % genomeLength;
  return zeroBased + 1;
};

export const positionToAngle = (
  position: number,
  genomeLength: number,
  anchorDeg: number = DEFAULT_ANCHOR_DEG
): number => {
  const normalizedPosition = normalizePosition(position, genomeLength);
  const progress = (normalizedPosition - 1) / genomeLength;
  return anchorDeg + progress * 360;
};

export const buildDecileTicks = (genomeLength: number): CircularTick[] => {
  if (genomeLength <= 0) {
    return [];
  }

  const positions = new Set<number>([1]);

  for (let index = 1; index <= 10; index += 1) {
    positions.add(Math.round((genomeLength * index) / 10));
  }

  return [...positions]
    .sort((left, right) => left - right)
    .map((position) => ({
      position,
      angleDeg: positionToAngle(position, genomeLength)
    }));
};

export const buildVisibleArc = (
  visibleStart: number,
  visibleEnd: number,
  genomeLength: number
): CircularArc => {
  const normalizedStart = normalizePosition(visibleStart, genomeLength);
  const normalizedEnd = normalizePosition(visibleEnd, genomeLength);

  const spanBases = ((normalizedEnd - normalizedStart + genomeLength) % genomeLength) + 1;
  const spanAngleDeg = (spanBases / genomeLength) * 360;
  const startAngleDeg = positionToAngle(normalizedStart, genomeLength);

  return {
    startAngleDeg,
    spanAngleDeg,
    endAngleDeg: startAngleDeg + spanAngleDeg
  };
};
