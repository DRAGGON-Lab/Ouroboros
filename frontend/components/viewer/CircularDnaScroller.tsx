"use client";

import React, { useMemo, useRef, useState } from "react";

import type { SequenceAnnotation } from "../../shared/types/ts";

interface CircularDnaScrollerProps {
  sequence: string;
  annotations: SequenceAnnotation[];
}

interface SelectionRange {
  start: number;
  end: number;
}

const FALLBACK_SEQUENCE = "ACGT".repeat(120);
const MIN_RENDER_BASES = 240;
const BASE_TILE_PX = 22;
const LINEAR_VISIBLE_BASES = 80;

const normalizeSequence = (sequence: string): string => {
  const compact = sequence.replace(/\s+/g, "").toUpperCase();
  if (compact.length > 0) {
    return compact;
  }

  return FALLBACK_SEQUENCE;
};

const getTopBorderColor = (index: number, annotations: SequenceAnnotation[]): string => {
  const oneBasedIndex = index + 1;
  const activeFeature = annotations.find((feature) => oneBasedIndex >= feature.start && oneBasedIndex <= feature.end);

  if (!activeFeature) {
    return "#101828";
  }

  return activeFeature.type === "promoter" ? "#2e90fa" : "#12b76a";
};

const wrapOneBased = (position: number, length: number): number => {
  const zeroBased = ((position - 1) % length + length) % length;
  return zeroBased + 1;
};

const indexToOneBased = (index: number, length: number): number => ((index % length) + length) % length + 1;

const formatSelectionSummary = (selection: SelectionRange | null, fallback: number, total: number): string => {
  if (!selection) {
    return `${fallback.toLocaleString()} / ${total.toLocaleString()}`;
  }

  if (selection.start === selection.end) {
    return `${selection.start.toLocaleString()} / ${total.toLocaleString()}`;
  }

  return `${selection.start.toLocaleString()}-${selection.end.toLocaleString()} / ${total.toLocaleString()}`;
};

const parseSelectionInput = (raw: string, total: number): SelectionRange | null => {
  const compact = raw.replace(/\s+/g, "");
  if (compact.length === 0) {
    return null;
  }

  const fullMatch = compact.match(/^(?<start>[\d,]+)(?:-(?<end>[\d,]+))?(?:\/(?<total>[\d,]+))?$/);
  if (!fullMatch || !fullMatch.groups) {
    return null;
  }

  const start = Number(fullMatch.groups.start.replace(/,/g, ""));
  const end = fullMatch.groups.end ? Number(fullMatch.groups.end.replace(/,/g, "")) : start;

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < 1 || start > total || end > total) {
    return null;
  }

  return {
    start: Math.min(start, end),
    end: Math.max(start, end)
  };
};

export const buildCircularTrack = (sequence: string): string => {
  const normalized = normalizeSequence(sequence);
  const minimumRepeats = Math.max(1, Math.ceil(MIN_RENDER_BASES / normalized.length));
  const expanded = normalized.repeat(minimumRepeats);

  return expanded.repeat(3);
};

export default function CircularDnaScroller({ sequence, annotations }: CircularDnaScrollerProps) {
  const dragAnchorRef = useRef<number | null>(null);
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [selectionInput, setSelectionInput] = useState<string>("");
  const [trackX, setTrackX] = useState<number>(0);

  const normalized = useMemo(() => normalizeSequence(sequence), [sequence]);
  const circularTrack = useMemo(() => buildCircularTrack(normalized), [normalized]);
  const baseTopBorderColors = useMemo(
    () => Array.from({ length: normalized.length }, (_, index) => getTopBorderColor(index, annotations)),
    [annotations, normalized.length]
  );
  const promoterCount = useMemo(() => annotations.filter((item) => item.type === "promoter").length, [annotations]);
  const cdsCount = useMemo(() => annotations.filter((item) => item.type === "CDS").length, [annotations]);

  const sequenceWidth = normalized.length * BASE_TILE_PX;
  const midpoint = -sequenceWidth;
  const wrappedTrackX = midpoint + ((((trackX - midpoint) % sequenceWidth) + sequenceWidth) % sequenceWidth);

  const currentPosition = useMemo(() => {
    const localX = wrappedTrackX - midpoint;
    const pixelsFromStart = ((-localX % sequenceWidth) + sequenceWidth) % sequenceWidth;
    const baseIndex = Math.floor(pixelsFromStart / BASE_TILE_PX);
    return baseIndex + 1;
  }, [midpoint, sequenceWidth, wrappedTrackX]);

  const linearWindow = useMemo(() => {
    const visibleBaseCount = Math.min(LINEAR_VISIBLE_BASES, normalized.length);
    const halfWindow = Math.floor(visibleBaseCount / 2);
    const start = wrapOneBased(currentPosition - halfWindow, normalized.length);
    return Array.from({ length: visibleBaseCount }, (_, index) => {
      const oneBasedPosition = wrapOneBased(start + index, normalized.length);
      return {
        key: `${oneBasedPosition}-${index}`,
        oneBasedPosition,
        base: normalized[oneBasedPosition - 1] ?? "-"
      };
    });
  }, [currentPosition, normalized]);

  const visibleRangeLabel = useMemo(() => {
    const first = linearWindow[0]?.oneBasedPosition ?? 1;
    const last = linearWindow[linearWindow.length - 1]?.oneBasedPosition ?? 1;
    return `${first.toLocaleString()}-${last.toLocaleString()} / ${normalized.length.toLocaleString()}`;
  }, [linearWindow, normalized.length]);

  const selectionSummary = useMemo(
    () => formatSelectionSummary(selection, currentPosition, normalized.length),
    [currentPosition, normalized.length, selection]
  );

  const isSelected = (position: number): boolean => {
    if (!selection) {
      return false;
    }

    return position >= selection.start && position <= selection.end;
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > 0 ? event.deltaX : event.deltaY;
    setTrackX((previous) => previous - delta);
  };

  const commitSelectionInput = (): void => {
    const parsed = parseSelectionInput(selectionInput, normalized.length);
    if (!parsed) {
      return;
    }

    setSelection(parsed);
    setTrackX(midpoint - (parsed.start - 1) * BASE_TILE_PX);
  };

  return (
    <section className="dnaScroller" aria-label="dna-scroller">
      <header className="dnaScrollerHeader">
        <h1>DNA Viewer</h1>
        <p>
          Circular sequence · position <strong>{selectionSummary}</strong>
        </p>
        <p>Linear window: {visibleRangeLabel}</p>
      </header>

      <div className="featureLegend" aria-label="feature-legend">
        <div className="featureLegendItem">
          <span className="featureSwatch promoter" aria-hidden="true" />
          <span>Promoter ({promoterCount})</span>
        </div>
        <div className="featureLegendItem">
          <span className="featureSwatch cds" aria-hidden="true" />
          <span>CDS ({cdsCount})</span>
        </div>
      </div>

      <div className="selectionControls" aria-label="selection-controls">
        <label htmlFor="selection-range">Select position/range</label>
        <input
          id="selection-range"
          value={selectionInput}
          onChange={(event) => setSelectionInput(event.target.value)}
          onBlur={commitSelectionInput}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitSelectionInput();
            }
          }}
          placeholder={`1,622-1,640 / ${normalized.length.toLocaleString()}`}
        />
      </div>

      <div className="dnaViewport" onWheel={handleWheel} aria-label="dna-viewport">
        <div className="dnaCenterMarker" aria-hidden="true" />
        <div className="dnaTrack" style={{ transform: `translateX(${wrappedTrackX}px)` }} aria-label="dna-track">
          {Array.from(circularTrack).map((base, index) => {
            const normalizedIndex = index % normalized.length;
            const oneBasedPosition = indexToOneBased(normalizedIndex, normalized.length);
            return (
              <span
                key={`${index}-${base}`}
                className={`dnaBase ${isSelected(oneBasedPosition) ? "dnaBaseSelected" : ""}`}
                style={{ borderTopColor: baseTopBorderColors[normalizedIndex] ?? "#101828" }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      <div className="linearZoomPanel" aria-label="linear-zoom-panel" onWheel={handleWheel}>
        {linearWindow.map(({ key, oneBasedPosition, base }) => {
          const selected = isSelected(oneBasedPosition);
          return (
            <button
              key={key}
              type="button"
              className={`linearZoomBase ${selected ? "linearZoomBaseSelected" : ""}`}
              onMouseDown={() => {
                dragAnchorRef.current = oneBasedPosition;
                setSelection({ start: oneBasedPosition, end: oneBasedPosition });
              }}
              onMouseEnter={(event) => {
                if (dragAnchorRef.current === null || event.buttons !== 1) {
                  return;
                }

                setSelection({
                  start: Math.min(dragAnchorRef.current, oneBasedPosition),
                  end: Math.max(dragAnchorRef.current, oneBasedPosition)
                });
              }}
              onMouseUp={() => {
                dragAnchorRef.current = null;
              }}
              aria-label={`base-${oneBasedPosition}`}
            >
              <span>{base}</span>
              <small>{oneBasedPosition.toLocaleString()}</small>
            </button>
          );
        })}
      </div>

      <p className="dnaHint">Use horizontal or vertical wheel on the DNA views to scroll. Click or drag over linear bases to select ranges.</p>
    </section>
  );
}

export { parseSelectionInput };
