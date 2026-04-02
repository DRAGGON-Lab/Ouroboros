export type BaseCode = "A" | "C" | "G" | "T" | "-";

export type FunctionCode = "P" | "C" | "-";

export interface ViewerRegion {
  start: number;
  end: number;
  center: number;
}

export interface ViewerWindowResponse {
  sequenceId: string;
  genomeLength: number;
  requestedCenter: number;
  visibleStart: number;
  visibleEnd: number;
  fetchStart: number;
  fetchEnd: number;
  visibleLength: number;
  bufferLeft: number;
  bufferRight: number;
  bases: string;
  forwardFn: string;
  reverseFn: string;
  forwardActivity: number[];
  reverseActivity: number[];
}

export interface ViewerPayload {
  accession: string;
  genomeLength: number;
  region: ViewerRegion;
  fetchRange: {
    start: number;
    end: number;
  };
  visibleLength: number;
  bufferLeft: number;
  bufferRight: number;
  bases: string;
  forwardFn: string;
  reverseFn: string;
  forwardActivity: number[];
  reverseActivity: number[];
  visibleBases: string;
  visibleForwardFn: string;
  visibleReverseFn: string;
  visibleForwardActivity: number[];
  visibleReverseActivity: number[];
}


export type ViewerSequenceSource = "example_sequence" | "example_plasmid";

export interface ViewerSequenceResponse {
  source: ViewerSequenceSource;
  sequenceId: string;
  sequence: string;
  length: number;
  annotations: SequenceAnnotation[];
}

export type FunctionalAnnotationType = "promoter" | "CDS";

export interface SequenceAnnotation {
  id: string;
  type: FunctionalAnnotationType;
  label: string;
  start: number;
  end: number;
  strand: "forward" | "reverse";
  annotation_source: "curated" | "inferred";
  activity_type: "measured" | "predicted";
}
