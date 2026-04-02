"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
const LINEAR_WINDOW_SIZE = 72;

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
  const normalized = ((position - 1) % length + length) % length;
  return normalized + 1;
};

const normalizeSelectionRange = (start: number, end: number): SelectionRange => {
  if (start <= end) {
    return { start, end };
  }

  return { start: end, end: start };
};

export const buildCircularTrack = (sequence: string): string => {
  const normalized = normalizeSequence(sequence);
  const minimumRepeats = Math.max(1, Math.ceil(MIN_RENDER_BASES / normalized.length));
  const expanded = normalized.repeat(minimumRepeats);

  return expanded.repeat(3);
};

export default function CircularDnaScroller({ sequence, annotations }: CircularDnaScrollerProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentXRef = useRef<number>(0);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [selection, setSelection] = useState<SelectionRange>({ start: 1, end: 1 });

  const normalized = useMemo(() => normalizeSequence(sequence), [sequence]);
  const circularTrack = useMemo(() => buildCircularTrack(normalized), [normalized]);
  const baseTopBorderColors = useMemo(
    () => Array.from({ length: normalized.length }, (_, index) => getTopBorderColor(index, annotations)),
    [annotations, normalized.length]
  );
  const promoterCount = useMemo(() => annotations.filter((item) => item.type === "promoter").length, [annotations]);
  const cdsCount = useMemo(() => annotations.filter((item) => item.type === "CDS").length, [annotations]);

  const selectionLabel =
    selection.start === selection.end
      ? selection.start.toLocaleString()
      : `${selection.start.toLocaleString()}-${selection.end.toLocaleString()}`;

  const linearWindow = useMemo(() => {
    const half = Math.floor(LINEAR_WINDOW_SIZE / 2);
    const indexes = Array.from({ length: LINEAR_WINDOW_SIZE }, (_, offset) => {
      const absolutePosition = wrapOneBased(currentPosition - half + offset, normalized.length);
      return {
        absolutePosition,
        base: normalized[absolutePosition - 1] ?? "-"
      };
    });

    return indexes;
  }, [currentPosition, normalized]);

  useEffect(() => {
    if (!trackRef.current) {
      return;
    }

    const sequenceWidth = normalized.length * BASE_TILE_PX;
    const midpoint = -sequenceWidth;

    const clampToCircle = (rawX: number): number => {
      const offset = rawX - midpoint;
      const wrapped = ((offset % sequenceWidth) + sequenceWidth) % sequenceWidth;
      return midpoint + wrapped;
    };

    const updatePositionLabel = (wrappedX: number): void => {
      const localX = wrappedX - midpoint;
      const pixelsFromStart = ((-localX % sequenceWidth) + sequenceWidth) % sequenceWidth;
      const baseIndex = Math.floor(pixelsFromStart / BASE_TILE_PX);
      setCurrentPosition(baseIndex + 1);
    };

    const applyWrappedX = (rawX: number): void => {
      const wrappedX = clampToCircle(rawX);
      currentXRef.current = wrappedX;
      trackRef.current.style.transform = `translateX(${wrappedX}px)`;
      updatePositionLabel(wrappedX);
    };

    applyWrappedX(midpoint);

    const handleWindowWheel = (event: WheelEvent): void => {
      const delta = Math.abs(event.deltaX) > 0 ? event.deltaX : event.deltaY;
      if (delta === 0) {
        return;
      }

      event.preventDefault();
      applyWrappedX(currentXRef.current - delta);
    };

    window.addEventListener("wheel", handleWindowWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWindowWheel);
    };
  }, [normalized]);

  return (
    <section className="dnaScroller" aria-label="dna-scroller">
      <header className="dnaScrollerHeader">
        <h1>DNA Viewer</h1>
        <p aria-label="position-indicator">
          Circular sequence · position <strong>{selectionLabel}</strong> / {normalized.length.toLocaleString()}
        </p>
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

      <div className="dnaViewport" aria-label="dna-viewport">
        <div className="dnaCenterMarker" aria-hidden="true" />
        <div className="dnaTrack" ref={trackRef} aria-label="dna-track">
          {Array.from(circularTrack).map((base, index) => {
            const normalizedIndex = index % normalized.length;
            return (
              <span
                key={`${index}-${base}`}
                className="dnaBase"
                style={{
                  borderTopColor: baseTopBorderColors[normalizedIndex] ?? "#101828",
                  borderBottomColor: baseTopBorderColors[normalizedIndex] ?? "#101828"
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      <section className="linearSelectionSection" aria-label="linear-selection-view">
        <p className="linearSelectionTitle">Linear window (click to select, shift+click to extend range)</p>
        <div className="linearWindowTrack" role="listbox" aria-label="linear-selection-track">
          {linearWindow.map((item, windowIndex) => {
            const isSelected = item.absolutePosition >= selection.start && item.absolutePosition <= selection.end;
            const isCenter = item.absolutePosition === currentPosition;
            return (
              <button
                key={`window-${windowIndex}-${item.absolutePosition}`}
                type="button"
                className={`linearWindowBase${isSelected ? " selected" : ""}${isCenter ? " center" : ""}`}
                onClick={(event) => {
                  if (event.shiftKey) {
                    setSelection((prev) => normalizeSelectionRange(prev.start, item.absolutePosition));
                    return;
                  }

                  setSelection({ start: item.absolutePosition, end: item.absolutePosition });
                }}
                aria-label={`position-${item.absolutePosition}`}
              >
                <span>{item.base}</span>
                <small>{item.absolutePosition.toLocaleString()}</small>
              </button>
            );
          })}
        </div>
      </section>

      <p className="dnaHint">Use mouse wheel (horizontal or vertical) anywhere in this viewer to rotate sequence.</p>
    </section>
  );
}
