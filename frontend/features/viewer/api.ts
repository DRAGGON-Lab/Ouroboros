import type { FeatureBlock, NucleotideBlock, ViewerPayload, ViewerRegion } from "../../shared/types/ts";

const WINDOW_RADIUS = 250;

const createCenteredRegion = (coordinate: number): ViewerRegion => ({
  center: coordinate,
  start: Math.max(1, coordinate - WINDOW_RADIUS),
  end: coordinate + WINDOW_RADIUS
});

const buildNucleotideBlocks = (region: ViewerRegion): NucleotideBlock[] => {
  const midpoint = Math.floor((region.start + region.end) / 2);

  return [
    {
      id: "nt-forward-1",
      start: region.start,
      end: midpoint,
      strand: "forward",
      label: "Nucleotide window A"
    },
    {
      id: "nt-reverse-1",
      start: midpoint + 1,
      end: region.end,
      strand: "reverse",
      label: "Nucleotide window B"
    }
  ];
};

const buildFeatureBlocks = (region: ViewerRegion): FeatureBlock[] => {
  const quarter = Math.floor((region.end - region.start) / 4);

  return [
    {
      id: "feature-gene-a",
      start: region.start + quarter,
      end: region.start + quarter * 2,
      strand: "forward",
      type: "gene",
      label: "Placeholder gene A",
      source: "curated"
    },
    {
      id: "feature-reg-b",
      start: region.start + quarter * 2,
      end: region.start + quarter * 3,
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
