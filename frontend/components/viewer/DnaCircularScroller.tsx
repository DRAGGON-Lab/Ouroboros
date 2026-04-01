"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

interface DnaCircularScrollerProps {
  sequence: string;
  initialCoordinate: number;
  onCenterCoordinateChange?: (coordinate: number) => void;
}

const BASE_WIDTH = 26;

const normalizeSequence = (sequence: string): string => {
  const cleaned = sequence.toUpperCase().replace(/[^ACGT]/g, "");
  return cleaned.length > 0 ? cleaned : "ACGT".repeat(200);
};

const wrapCoordinate = (coordinate: number, genomeLength: number): number => {
  if (genomeLength <= 0) {
    return 1;
  }

  const zeroIndexed = ((coordinate - 1) % genomeLength + genomeLength) % genomeLength;
  return zeroIndexed + 1;
};

export default function DnaCircularScroller({
  sequence,
  initialCoordinate,
  onCenterCoordinateChange
}: DnaCircularScrollerProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [centerCoordinate, setCenterCoordinate] = useState(1);

  const normalized = useMemo(() => normalizeSequence(sequence), [sequence]);
  const genomeLength = normalized.length;
  const repeatedSequence = useMemo(() => `${normalized}${normalized}${normalized}`, [normalized]);

  useEffect(() => {
    gsap.registerPlugin(Draggable);

    const track = trackRef.current;
    const viewport = viewportRef.current;

    if (!track || !viewport) {
      return;
    }

    const segmentWidth = genomeLength * BASE_WIDTH;
    const viewportWidth = viewport.clientWidth;
    const middleStart = -segmentWidth;
    const centeredBaseOffset = (viewportWidth / 2) - (BASE_WIDTH / 2);
    const initialX = middleStart + centeredBaseOffset - (wrapCoordinate(initialCoordinate, genomeLength) - 1) * BASE_WIDTH;

    gsap.set(track, { x: initialX });

    const updateCoordinate = (xValue: number) => {
      const relative = centeredBaseOffset - xValue;
      const rawBase = Math.round(relative / BASE_WIDTH);
      const wrapped = wrapCoordinate(rawBase + 1, genomeLength);
      setCenterCoordinate(wrapped);
      onCenterCoordinateChange?.(wrapped);
    };

    updateCoordinate(initialX);

    const draggable = Draggable.create(track, {
      type: "x",
      inertia: false,
      allowContextMenu: true,
      onDrag() {
        const x = Number(gsap.getProperty(track, "x"));
        const wrappedX = gsap.utils.wrap(middleStart - segmentWidth, middleStart + segmentWidth, x);
        gsap.set(track, { x: wrappedX });
        updateCoordinate(wrappedX);
      }
    })[0];

    return () => {
      draggable.kill();
    };
  }, [genomeLength, initialCoordinate, onCenterCoordinateChange]);

  return (
    <section className="dnaScroller" aria-label="dna-circular-scroller">
      <header className="dnaScrollerHeader">
        <h2>DNA Sequence</h2>
        <p>
          Center position: <strong>{centerCoordinate.toLocaleString()}</strong>
        </p>
      </header>

      <div className="dnaViewport" ref={viewportRef} aria-label="dna-scroll-viewport">
        <div className="dnaCenterLine" aria-hidden="true" />
        <div className="dnaTrack" ref={trackRef}>
          {Array.from(repeatedSequence).map((base, index) => (
            <span className={`dnaBase dnaBase${base}`} key={`${base}-${index}`}>
              {base}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
