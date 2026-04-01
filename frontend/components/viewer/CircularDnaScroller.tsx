"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

interface CircularDnaScrollerProps {
  sequence: string;
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

export const buildCircularTrack = (sequence: string): string => {
  const normalized = normalizeSequence(sequence);
  const minimumRepeats = Math.max(1, Math.ceil(MIN_RENDER_BASES / normalized.length));
  const expanded = normalized.repeat(minimumRepeats);

  return expanded.repeat(3);
};

export default function CircularDnaScroller({ sequence }: CircularDnaScrollerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [currentPosition, setCurrentPosition] = useState(1);

  const normalized = useMemo(() => normalizeSequence(sequence), [sequence]);
  const circularTrack = useMemo(() => buildCircularTrack(normalized), [normalized]);

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

    gsap.set(trackRef.current, { x: midpoint });
    updatePositionLabel(midpoint);

    const draggable = Draggable.create(trackRef.current, {
      type: "x",
      bounds: {
        minX: midpoint - sequenceWidth,
        maxX: midpoint + sequenceWidth
      },
      inertia: false,
      onDrag() {
        const nextX = clampToCircle(this.x);
        gsap.set(trackRef.current, { x: nextX });
        updatePositionLabel(nextX);
      },
      onThrowUpdate() {
        const nextX = clampToCircle(this.x);
        gsap.set(trackRef.current, { x: nextX });
        updatePositionLabel(nextX);
      }
    })[0];

    return () => {
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
          {Array.from(circularTrack).map((base, index) => (
            <span key={`${index}-${base}`} className={`dnaBase dnaBase-${base}`}>
              {base}
            </span>
          ))}
        </div>
      </div>

      <p className="dnaHint">Drag left or right to scroll through the circular DNA sequence.</p>
    </section>
  );
}
