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

const normalizeSequence = (sequence: string): string => {
  const compact = sequence.replace(/\s+/g, "").toUpperCase();
  return compact.length > 0 ? compact : FALLBACK_SEQUENCE;
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
  return normalized.repeat(minimumRepeats).repeat(3);
};

export default function CircularDnaScroller({ sequence, annotations, sourceSelector }: CircularDnaScrollerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const circularTrackRef = useRef<SVGSVGElement | null>(null);
  const draggableRef = useRef<{ update: () => void; kill: () => void } | null>(null);
  const currentXRef = useRef<number>(0);
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
  const selectionStartFraction = useMemo(() => ((currentFraction - visibleFraction / 2) % 1 + 1) % 1, [currentFraction, visibleFraction]);
  const selectionSweepDegrees = useMemo(() => Math.max(4, visibleFraction * 360), [visibleFraction]);

  const forwardFeatureArcs = useMemo(
    () =>
      annotations
        .filter((feature) => feature.strand === "forward")
        .map((feature) => {
          const clampedStart = Math.max(1, Math.min(normalized.length, feature.start));
          const clampedEnd = Math.max(clampedStart, Math.min(normalized.length, feature.end));
          return {
            startFraction: (clampedStart - 1) / normalized.length,
            endFraction: clampedEnd / normalized.length,
            color: feature.type === "promoter" ? "#2e90fa" : "#12b76a"
          };
        }),
    [annotations, normalized.length]
  );

  const clampToCircle = useCallback((rawX: number): number => {
    const sequenceWidth = normalized.length * BASE_TILE_PX;
    const midpoint = -sequenceWidth;
    const offset = rawX - midpoint;
    const wrapped = ((offset % sequenceWidth) + sequenceWidth) % sequenceWidth;
    return midpoint + wrapped;
  }, [normalized.length]);

  const applyWrappedX = useCallback((rawX: number): void => {
    if (!trackRef.current) {
      return;
    }

    const sequenceWidth = normalized.length * BASE_TILE_PX;
    const midpoint = -sequenceWidth;
    const wrappedX = clampToCircle(rawX);
    const localX = wrappedX - midpoint;
    const pixelsFromStart = ((-localX % sequenceWidth) + sequenceWidth) % sequenceWidth;

    currentXRef.current = wrappedX;
    gsap.set(trackRef.current, { x: wrappedX });
    setCurrentPosition(Math.floor(pixelsFromStart / BASE_TILE_PX) + 1);
  }, [clampToCircle, normalized.length]);

  const applyCurrentPosition = useCallback((nextPosition: number): void => {
    if (!Number.isFinite(nextPosition)) {
      return;
    }

    const normalizedPosition = ((Math.round(nextPosition) - 1) % normalized.length + normalized.length) % normalized.length;
    const sequenceWidth = normalized.length * BASE_TILE_PX;
    const midpoint = -sequenceWidth;
    applyWrappedX(midpoint - normalizedPosition * BASE_TILE_PX);
    draggableRef.current?.update();
  }, [applyWrappedX, normalized.length]);

  const updatePositionFromCircularPointer = useCallback((clientX: number, clientY: number): void => {
    if (!circularTrackRef.current) {
      return;
    }

    const rect = circularTrackRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    if (![clientX, clientY, centerX, centerY].every((value) => Number.isFinite(value))) {
      return;
    }

    const angleDegrees = (Math.atan2(clientY - centerY, clientX - centerX) * 180) / Math.PI;
    const fraction = ((angleDegrees + 90 + 360) % 360) / 360;
    const nextPosition = Math.max(1, Math.min(normalized.length, Math.round(fraction * normalized.length) + 1));
    applyCurrentPosition(nextPosition);
  }, [applyCurrentPosition, normalized.length]);

  useEffect(() => {
    if (!trackRef.current || !viewportRef.current) {
      return;
    }

    gsap.registerPlugin(Draggable);
    const sequenceWidth = normalized.length * BASE_TILE_PX;
    const midpoint = -sequenceWidth;

    applyWrappedX(midpoint);

    const draggable = Draggable.create(trackRef.current, {
      type: "x",
      bounds: { minX: midpoint - sequenceWidth, maxX: midpoint + sequenceWidth },
      inertia: false,
      onDrag() {
        applyWrappedX(this.x);
      },
      onThrowUpdate() {
        applyWrappedX(this.x);
      }
    })[0];

    draggableRef.current = draggable;

    const handleWindowWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const horizontalContribution = Math.abs(event.deltaX) > 0 ? event.deltaX : 0;
      const verticalContribution = -event.deltaY;
      applyWrappedX(currentXRef.current - (horizontalContribution + verticalContribution));
      draggable.update();
    };

    window.addEventListener("wheel", handleWindowWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWindowWheel);
      draggableRef.current = null;
      draggable.kill();
    };
  }, [applyWrappedX, normalized.length]);

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
    return () => observer.disconnect();
  }, [normalized.length]);

  const polarToCartesian = (radius: number, angleDegrees: number): { x: number; y: number } => {
    const radians = (Math.PI / 180) * angleDegrees;
    return { x: SVG_CENTER + radius * Math.cos(radians), y: SVG_CENTER + radius * Math.sin(radians) };
  };

  const buildArcPath = (radius: number, startFraction: number, endFraction: number): string => {
    const startAngle = -90 + startFraction * 360;
    const endAngle = -90 + endFraction * 360;
    const delta = endAngle - startAngle;
    const start = polarToCartesian(radius, startAngle);
    const end = polarToCartesian(radius, endAngle);
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${Math.abs(delta) > 180 ? 1 : 0} ${delta >= 0 ? 1 : 0} ${end.x} ${end.y}`;
  };

  const buildSweepPath = (radius: number, startFraction: number, sweepDegrees: number): string => {
    const start = -90 + startFraction * 360;
    const end = start + sweepDegrees;
    const startPoint = polarToCartesian(radius, start);
    const endPoint = polarToCartesian(radius, end);
    return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${sweepDegrees > 180 ? 1 : 0} 1 ${endPoint.x} ${endPoint.y}`;
  };

  const beginCircularDrag = (clientX: number, clientY: number): void => {
    setIsCircularDragging(true);
    updatePositionFromCircularPointer(clientX, clientY);
  };

  const continueCircularDrag = (clientX: number, clientY: number): void => {
    if (!isCircularDragging) {
      return;
    }

    updatePositionFromCircularPointer(clientX, clientY);
  };

  const endCircularDrag = (): void => {
    setIsCircularDragging(false);
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
          ref={circularTrackRef}
          aria-label="dna-circular-track"
          viewBox={`0 0 ${SVG_VIEWBOX_SIZE} ${SVG_VIEWBOX_SIZE}`}
          onPointerDown={(event) => beginCircularDrag(event.clientX, event.clientY)}
          onPointerMove={(event) => continueCircularDrag(event.clientX, event.clientY)}
          onPointerUp={endCircularDrag}
          onPointerLeave={endCircularDrag}
          onMouseDown={(event) => beginCircularDrag(event.clientX, event.clientY)}
          onMouseMove={(event) => continueCircularDrag(event.clientX, event.clientY)}
          onMouseUp={endCircularDrag}
          onMouseLeave={endCircularDrag}
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
          <path d={buildSweepPath(SELECTION_RADIUS, selectionStartFraction, selectionSweepDegrees)} className="dnaCircularSelectionArc" />
        </svg>
      </section>
    </section>
  );
}
