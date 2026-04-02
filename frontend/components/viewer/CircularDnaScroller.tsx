"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap/dist/gsap";
import { Draggable } from "gsap/dist/Draggable";

import type { SequenceAnnotation } from "../../shared/types/ts";

interface CircularDnaScrollerProps {
  sequence: string;
  annotations: SequenceAnnotation[];
}

const FALLBACK_SEQUENCE = "ACGT".repeat(120);
const MIN_RENDER_BASES = 240;
const BASE_TILE_PX = 22;

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

export default function CircularDnaScroller({ sequence, annotations }: CircularDnaScrollerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentXRef = useRef<number>(0);
  const [currentPosition, setCurrentPosition] = useState(1);

  const normalized = useMemo(() => normalizeSequence(sequence), [sequence]);
  const circularTrack = useMemo(() => buildCircularTrack(normalized), [normalized]);
  const baseTopBorderColors = useMemo(
    () => Array.from({ length: normalized.length }, (_, index) => getTopBorderColor(index, annotations)),
    [annotations, normalized.length]
  );
  const promoterCount = useMemo(() => annotations.filter((item) => item.type === "promoter").length, [annotations]);
  const cdsCount = useMemo(() => annotations.filter((item) => item.type === "CDS").length, [annotations]);
  const circleRotationDegrees = useMemo(() => {
    if (normalized.length === 0) {
      return 0;
    }

    return -((currentPosition - 1) / normalized.length) * 360;
  }, [currentPosition, normalized.length]);

  useEffect(() => {
    if (!trackRef.current || !viewportRef.current) {
      return;
    }

    gsap.registerPlugin(Draggable);

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
      gsap.set(trackRef.current, { x: wrappedX });
      updatePositionLabel(wrappedX);
    };

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
      const isHorizontalGesture = Math.abs(event.deltaX) > 0 || event.shiftKey;

      if (!isHorizontalGesture) {
        return;
      }

      event.preventDefault();
      const delta = Math.abs(event.deltaX) > 0 ? event.deltaX : event.deltaY;
      applyWrappedX(currentXRef.current - delta);
      draggable.update();
    };

    window.addEventListener("wheel", handleWindowWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWindowWheel);
      draggable.kill();
    };
  }, [normalized]);

  return (
    <section className="dnaScroller" aria-label="dna-scroller">
      <header className="dnaScrollerHeader">
        <h1>DNA Viewer</h1>
        <p>
          Circular sequence · position <strong>{currentPosition.toLocaleString()}</strong> / {normalized.length.toLocaleString()}
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

      <p className="dnaHint">Drag DNA, or use horizontal wheel/shift+wheel anywhere in the viewer window.</p>

      <section className="dnaCircularPanel" aria-label="dna-circular-panel">
        <div className="dnaCircularMarker" aria-hidden="true" />
        <div
          className="dnaCircularTrack"
          aria-label="dna-circular-track"
          style={{ transform: `rotate(${circleRotationDegrees}deg)` }}
        >
          <span className="dnaCircularLine dnaCircularLineOuter" aria-hidden="true" />
          <span className="dnaCircularLine dnaCircularLineInner" aria-hidden="true" />
        </div>
      </section>
    </section>
  );
}
