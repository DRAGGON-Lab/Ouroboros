"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import type { SequenceAnnotation } from "../../shared/types/ts";

interface CircularDnaScrollerProps {
  sequence: string;
  annotations: SequenceAnnotation[];
}

const FALLBACK_SEQUENCE = "ACGT".repeat(120);
const MIN_RENDER_BASES = 240;
const BASE_TILE_PX = 22;
const FEATURE_COLORS: Record<SequenceAnnotation["type"], string> = {
  promoter: "#2e90fa",
  CDS: "#12b76a"
};

const normalizeSequence = (sequence: string): string => {
  const compact = sequence.replace(/\s+/g, "").toUpperCase();
  if (compact.length > 0) {
    return compact;
  }

  return FALLBACK_SEQUENCE;
};

export const buildCircularTrack = (sequence: string): string => {
  const normalized = normalizeSequence(sequence);
  const minimumRepeats = Math.max(1, Math.ceil(MIN_RENDER_BASES / normalized.length));
  const expanded = normalized.repeat(minimumRepeats);

  return expanded.repeat(3);
};

const inFeature = (position: number, annotation: SequenceAnnotation, sequenceLength: number): boolean => {
  if (annotation.start <= annotation.end) {
    return position >= annotation.start && position <= annotation.end;
  }

  return position >= annotation.start || position <= Math.min(annotation.end, sequenceLength);
};

export default function CircularDnaScroller({ sequence, annotations }: CircularDnaScrollerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const currentXRef = useRef<number>(0);
  const [currentPosition, setCurrentPosition] = useState(1);

  const normalized = useMemo(() => normalizeSequence(sequence), [sequence]);
  const circularTrack = useMemo(() => buildCircularTrack(normalized), [normalized]);
  const perBaseTopTrack = useMemo(
    () =>
      Array.from({ length: normalized.length }, (_, index) => {
        const position = index + 1;
        const matchingFeature = annotations.find((annotation) =>
          inFeature(position, annotation, normalized.length)
        );

        return matchingFeature ? FEATURE_COLORS[matchingFeature.type] : "#101828";
      }),
    [annotations, normalized.length]
  );
  const topTrackColors = useMemo(() => [...perBaseTopTrack, ...perBaseTopTrack, ...perBaseTopTrack], [perBaseTopTrack]);
  const featureMapEntries = useMemo(
    () =>
      annotations.slice(0, 12).map((annotation) => ({
        ...annotation,
        startPct: (annotation.start / normalized.length) * 100,
        widthPct: (Math.max(1, annotation.end - annotation.start + 1) / normalized.length) * 100
      })),
    [annotations, normalized.length]
  );

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

      <div className="dnaViewport" ref={viewportRef} aria-label="dna-viewport">
        <div className="dnaCenterMarker" aria-hidden="true" />
        <div className="dnaTrack" ref={trackRef} aria-label="dna-track">
          {Array.from(circularTrack).map((base, index) => {
            const topLineColor = topTrackColors[index] ?? "#101828";
            return (
              <span key={`${index}-${base}`} className={`dnaBase dnaBase-${base}`}>
                <span className="dnaTopBorder" style={{ backgroundColor: topLineColor }} aria-hidden="true" />
                <span>{base}</span>
                <span className="dnaBottomBorder" aria-hidden="true" />
              </span>
            );
          })}
        </div>
      </div>
      <section className="featureMiniMap" aria-label="feature-mini-map">
        <p>Annotation map</p>
        <div className="featureMiniMapTrack">
          {featureMapEntries.map((annotation) => (
            <div
              key={annotation.id}
              className={`featureMiniMapSegment featureMiniMapSegment-${annotation.type}`}
              style={{
                left: `${annotation.startPct}%`,
                width: `${annotation.widthPct}%`
              }}
              title={`${annotation.label} (${annotation.type})`}
            />
          ))}
        </div>
        <div className="featureMiniMapLabels">
          {featureMapEntries.map((annotation) => (
            <span key={`${annotation.id}-label`}>
              {annotation.label}
            </span>
          ))}
        </div>
      </section>

      <p className="dnaHint">Drag DNA, or use horizontal wheel/shift+wheel anywhere in the viewer window.</p>
    </section>
  );
}
