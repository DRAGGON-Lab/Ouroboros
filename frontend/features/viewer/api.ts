import type { FeatureBlock, NucleotideBlock, ViewerPayload, ViewerRegion } from "../../shared/types/ts";

const WINDOW_RADIUS = 250;
const VIEWPORT_SPAN = WINDOW_RADIUS * 2 + 1;
const GENOME_LENGTH = 4_641_652;

const normalizeCoordinate = (coordinate: number): number => {
  const shifted = Math.trunc(coordinate) - 1;
  const wrapped = ((shifted % GENOME_LENGTH) + GENOME_LENGTH) % GENOME_LENGTH;
  return wrapped + 1;
};

const coordinateAtOffset = (anchor: number, offset: number): number => normalizeCoordinate(anchor + offset);

const createCenteredRegion = (coordinate: number): ViewerRegion => {
  const center = normalizeCoordinate(coordinate);

  return {
    center,
    start: coordinateAtOffset(center, -WINDOW_RADIUS),
    end: coordinateAtOffset(center, WINDOW_RADIUS)
  };
};

const buildNucleotideBlocks = (region: ViewerRegion): NucleotideBlock[] => {
  const firstSegmentLength = Math.floor(VIEWPORT_SPAN / 2);

  return [
    {
      id: "nt-forward-1",
      start: region.start,
      end: coordinateAtOffset(region.start, firstSegmentLength - 1),
      strand: "forward",
      label: "Nucleotide window A"
    },
    {
      id: "nt-reverse-1",
      start: coordinateAtOffset(region.start, firstSegmentLength),
      end: coordinateAtOffset(region.start, VIEWPORT_SPAN - 1),
      strand: "reverse",
      label: "Nucleotide window B"
    }
  ];
};

const buildFeatureBlocks = (region: ViewerRegion): FeatureBlock[] => {
  const quarterSpan = Math.floor(VIEWPORT_SPAN / 4);

  return [
    {
      id: "feature-gene-a",
      start: coordinateAtOffset(region.start, quarterSpan),
      end: coordinateAtOffset(region.start, quarterSpan * 2 - 1),
      strand: "forward",
      type: "gene",
      label: "Placeholder gene A",
      source: "curated"
    },
    {
      id: "feature-reg-b",
      start: coordinateAtOffset(region.start, quarterSpan * 2),
      end: coordinateAtOffset(region.start, quarterSpan * 3 - 1),
      strand: "reverse",
      type: "regulatory",
      label: "Placeholder element B",
      source: "inferred"
    }
  ];
};

export const loadViewerPayload = async (
  accession: string,
  selectedCoordinate: number
): Promise<ViewerPayload> => {
  const region = createCenteredRegion(selectedCoordinate);

  return Promise.resolve({
    accession,
    region,
    nucleotides: buildNucleotideBlocks(region),
    features: buildFeatureBlocks(region)
  });
};
