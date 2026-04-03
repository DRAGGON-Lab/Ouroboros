"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap/dist/gsap";
import { Draggable } from "gsap/dist/Draggable";

import type { SequenceAnnotation } from "../../shared/types/ts";

interface CircularDnaScrollerProps {
  sequence: string;
  annotations: SequenceAnnotation[];
  sourceSelector?: React.ReactNode;
}

const FALLBACK_SEQUENCE = "ACGT".repeat(120);
const MIN_RENDER_BASES = 240;
const BASE_TILE_PX = 22;
const OUTER_RADIUS = 124;
const INNER_RADIUS = 112;
const SELECTION_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2;
const SVG_VIEWBOX_SIZE = 300;
const SVG_CENTER = SVG_VIEWBOX_SIZE / 2;
const RING_TOLERANCE_FACTOR = 0.28;

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

export const buildCircularTrack = (sequence: string): string => {
  const normalized = normalizeSequence(sequence);
  const minimumRepeats = Math.max(1, Math.ceil(MIN_RENDER_BASES / normalized.length));
  const expanded = normalized.repeat(minimumRepeats);

  return expanded.repeat(3);
};

export const getPositionFromCircularClientPoint = ({
  bounds,
  clientX,
  clientY,
  sequenceLength,
  isDragging
}: {
  bounds: Pick<DOMRect, "width" | "height" | "left" | "top">;
  clientX: number;
  clientY: number;
  sequenceLength: number;
  isDragging: boolean;
}): number | null => {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY) || sequenceLength < 1) {
    return null;
  }

  const pointerX = clientX - bounds.left;
  const pointerY = clientY - bounds.top;
  const centerX = bounds.width / 2;
  const centerY = bounds.height / 2;
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const pointerRadius = Math.hypot(dx, dy);
  const normalizedSelectionRadius = (SELECTION_RADIUS / SVG_VIEWBOX_SIZE) * Math.min(bounds.width, bounds.height);
  const ringTolerance = normalizedSelectionRadius * RING_TOLERANCE_FACTOR;
  if (!isDragging && Math.abs(pointerRadius - normalizedSelectionRadius) > ringTolerance) {
    return null;
  }

  const angleDegrees = (Math.atan2(dy, dx) * 180) / Math.PI;
  const adjustedDegrees = ((angleDegrees + 90) % 360 + 360) % 360;
  const fraction = adjustedDegrees / 360;
  if (!Number.isFinite(fraction)) {
    return null;
  }

  const baseIndex = Math.floor(fraction * sequenceLength);
  return baseIndex + 1;
};

export default function CircularDnaScroller({ sequence, annotations, sourceSelector }: CircularDnaScrollerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const circularTrackRef = useRef<SVGSVGElement | null>(null);
  const currentXRef = useRef<number>(0);
  const applyWrappedXRef = useRef<(rawX: number) => void>(() => undefined);
  const sequenceWidthRef = useRef<number>(0);
  const midpointRef = useRef<number>(0);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [visibleBases, setVisibleBases] = useState(1);
  const [isCircularDragging, setIsCircularDragging] = useState(false);

  const normalized = useMemo(() => normalizeSequence(sequence), [sequence]);
  const circularTrack = useMemo(() => buildCircularTrack(normalized), [normalized]);
  const baseTopBorderColors = useMemo(
    () => Array.from({ length: normalized.length }, (_, index) => getTopBorderColor(index, annotations)),
    [annotations, normalized.length]
  );
  const promoterCount = useMemo(() => annotations.filter((item) => item.type === "promoter").length, [annotations]);
  const cdsCount = useMemo(() => annotations.filter((item) => item.type === "CDS").length, [annotations]);
  const currentFraction = useMemo(() => ((currentPosition - 1) % normalized.length) / normalized.length, [currentPosition, normalized.length]);
  const visibleFraction = useMemo(() => Math.min(1, visibleBases / normalized.length), [visibleBases, normalized.length]);
  const selectionStartFraction = useMemo(() => {
    const rawStart = currentFraction - visibleFraction / 2;
    return ((rawStart % 1) + 1) % 1;
  }, [currentFraction, visibleFraction]);
  const selectionSweepDegrees = useMemo(() => Math.max(4, visibleFraction * 360), [visibleFraction]);

  const forwardFeatureArcs = useMemo(
    () =>
      annotations
        .filter((feature) => feature.strand === "forward")
        .map((feature) => {
          const clampedStart = Math.max(1, Math.min(normalized.length, feature.start));
          const clampedEnd = Math.max(clampedStart, Math.min(normalized.length, feature.end));
          const startFraction = (clampedStart - 1) / normalized.length;
          const endFraction = clampedEnd / normalized.length;
          return {
            startFraction,
            endFraction,
            color: feature.type === "promoter" ? "#2e90fa" : "#12b76a"
          };
        }),
    [annotations, normalized.length]
  );

  const positionToWrappedX = useCallback((position: number): number => {
    const sequenceWidth = sequenceWidthRef.current;
    const midpoint = midpointRef.current;
    if (sequenceWidth <= 0) {
      return midpoint;
    }

    const baseIndex = Math.max(0, Math.min(normalized.length - 1, position - 1));
    return midpoint - baseIndex * BASE_TILE_PX;
  }, [normalized.length]);

  const updateFromCircularPointer = useCallback((target: SVGSVGElement, clientX: number, clientY: number): void => {
    if (!(target instanceof SVGSVGElement)) {
      return;
    }

    const nextPosition = getPositionFromCircularClientPoint({
      bounds: target.getBoundingClientRect(),
      clientX,
      clientY,
      sequenceLength: normalized.length,
      isDragging: isCircularDragging
    });
    if (!nextPosition) {
      return;
    }
    applyWrappedXRef.current(positionToWrappedX(nextPosition));
  }, [isCircularDragging, normalized.length, positionToWrappedX]);

  useEffect(() => {
    if (!trackRef.current || !viewportRef.current) {
      return;
    }

    gsap.registerPlugin(Draggable);

    const sequenceWidth = normalized.length * BASE_TILE_PX;
    const midpoint = -sequenceWidth;
    sequenceWidthRef.current = sequenceWidth;
    midpointRef.current = midpoint;

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
      gsap.set(trackRef.current, { x: wrappedX });
      updatePositionLabel(wrappedX);
    };
    applyWrappedXRef.current = applyWrappedX;

    applyWrappedX(midpoint);

    const draggable = Draggable.create(trackRef.current, {
      type: "x",
      bounds: {
        minX: midpoint - sequenceWidth,
        maxX: midpoint + sequenceWidth
      },
      inertia: false,
      onDrag() {
        applyWrappedX(this.x);
      },
      onThrowUpdate() {
        applyWrappedX(this.x);
      }
    })[0];

    const handleWindowWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const horizontalContribution = Math.abs(event.deltaX) > 0 ? event.deltaX : 0;
      const verticalContribution = -event.deltaY;
      const delta = horizontalContribution + verticalContribution;
      applyWrappedX(currentXRef.current - delta);
      draggable.update();
    };

    window.addEventListener("wheel", handleWindowWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWindowWheel);
      draggable.kill();
    };
  }, [normalized]);

  useEffect(() => {
    if (!isCircularDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent): void => {
      const circularTrack = circularTrackRef.current;
      if (!circularTrack) {
        return;
      }

      updateFromCircularPointer(circularTrack, event.clientX, event.clientY);
    };

    const handlePointerUp = (): void => {
      setIsCircularDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isCircularDragging, updateFromCircularPointer]);

  useEffect(() => {
    if (!viewportRef.current) {
      return;
    }

    const updateVisibleBases = (): void => {
      if (!viewportRef.current) {
        return;
      }

      const nextVisibleBases = Math.max(1, Math.round(viewportRef.current.clientWidth / BASE_TILE_PX));
      setVisibleBases(Math.min(normalized.length, nextVisibleBases));
    };

    updateVisibleBases();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateVisibleBases);
    observer.observe(viewportRef.current);

    return () => {
      observer.disconnect();
    };
  }, [normalized.length]);

  const polarToCartesian = (radius: number, angleDegrees: number): { x: number; y: number } => {
    const radians = (Math.PI / 180) * angleDegrees;
    return {
      x: SVG_CENTER + radius * Math.cos(radians),
      y: SVG_CENTER + radius * Math.sin(radians)
    };
  };

  const buildArcPath = (radius: number, startFraction: number, endFraction: number): string => {
    const startAngle = -90 + startFraction * 360;
    const endAngle = -90 + endFraction * 360;
    const delta = endAngle - startAngle;
    const largeArcFlag = Math.abs(delta) > 180 ? 1 : 0;
    const sweepFlag = delta >= 0 ? 1 : 0;
    const start = polarToCartesian(radius, startAngle);
    const end = polarToCartesian(radius, endAngle);
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  };

  const buildSweepPath = (radius: number, startFraction: number, sweepDegrees: number): string => {
    const start = -90 + startFraction * 360;
    const end = start + sweepDegrees;
    const largeArcFlag = sweepDegrees > 180 ? 1 : 0;
    const startPoint = polarToCartesian(radius, start);
    const endPoint = polarToCartesian(radius, end);
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`;
  };

  return (
    <section className="dnaScroller" aria-label="dna-scroller">
      <header className="dnaScrollerHeader dnaCompactHeader">
        <h1>DNA Viewer</h1>
        {sourceSelector ? <div className="dnaSourceSelector">{sourceSelector}</div> : null}
        <p>
          Circular sequence · position <strong>{currentPosition.toLocaleString()}</strong> / {normalized.length.toLocaleString()}
        </p>
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
      </header>

      <div className="dnaViewport" ref={viewportRef} aria-label="dna-viewport">
        <div className="dnaCenterMarker" aria-hidden="true" />
        <div className="dnaTrack" ref={trackRef} aria-label="dna-track">
          {Array.from(circularTrack).map((base, index) => {
            const normalizedIndex = index % normalized.length;
            return (
              <span
                key={`${index}-${base}`}
                className={`dnaBase dnaBase-${base}`}
                style={{ borderTopColor: baseTopBorderColors[normalizedIndex] ?? "#101828" }}
              >
                {base}
              </span>
            );
          })}
        </div>
      </div>

      <section className="dnaCircularPanel" aria-label="dna-circular-panel">
        <svg
          className="dnaCircularTrack"
          aria-label="dna-circular-track"
          viewBox={`0 0 ${SVG_VIEWBOX_SIZE} ${SVG_VIEWBOX_SIZE}`}
          onPointerDown={(event) => {
            setIsCircularDragging(true);
            if (circularTrackRef.current) {
              updateFromCircularPointer(circularTrackRef.current, event.clientX, event.clientY);
            }
          }}
          style={{ cursor: isCircularDragging ? "grabbing" : "grab" }}
          ref={circularTrackRef}
        >
          <circle className="dnaCircularBaseRing" cx={SVG_CENTER} cy={SVG_CENTER} r={OUTER_RADIUS} />
          <circle className="dnaCircularBaseRing" cx={SVG_CENTER} cy={SVG_CENTER} r={INNER_RADIUS} />

          {forwardFeatureArcs.map((arc, index) => (
            <path
              key={`${index}-${arc.startFraction}-${arc.endFraction}`}
              d={buildArcPath(OUTER_RADIUS, arc.startFraction, arc.endFraction)}
              className="dnaCircularFeatureArc"
              style={{ stroke: arc.color }}
            />
          ))}

          <path
            d={buildSweepPath(SELECTION_RADIUS, selectionStartFraction, selectionSweepDegrees)}
            className="dnaCircularSelectionArc"
          />
        </svg>
      </section>
    </section>
  );
}
