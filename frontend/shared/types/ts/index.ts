export interface ViewerRegion {
  start: number;
  end: number;
  center: number;
}

export interface NucleotideBlock {
  id: string;
  start: number;
  end: number;
  strand: "forward" | "reverse";
  label: string;
}

export interface FeatureBlock {
  id: string;
  start: number;
  end: number;
  strand: "forward" | "reverse";
  type: "gene" | "regulatory" | "misc";
  label: string;
  source: "curated" | "inferred";
}

export interface ViewerPayload {
  accession: string;
  region: ViewerRegion;
  nucleotides: NucleotideBlock[];
  features: FeatureBlock[];
}
