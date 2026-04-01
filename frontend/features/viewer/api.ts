import type { ViewerPayload, ViewerWindowResponse } from "../../shared/types/ts";

export const getVisibleSliceIndexes = (
  visibleStart: number,
  visibleEnd: number,
  fetchStart: number
): { startIndex: number; endIndexExclusive: number } => {
  const startIndex = Math.max(0, visibleStart - fetchStart);
  const endIndexExclusive = Math.max(startIndex, visibleEnd - fetchStart + 1);

  return {
    startIndex,
    endIndexExclusive
  };
};

export const buildVisibleWindow = (
  windowPayload: ViewerWindowResponse
): Pick<
  ViewerPayload,
  | "visibleBases"
  | "visibleForwardFn"
  | "visibleReverseFn"
  | "visibleForwardActivity"
  | "visibleReverseActivity"
> => {
  const { startIndex, endIndexExclusive } = getVisibleSliceIndexes(
    windowPayload.visibleStart,
    windowPayload.visibleEnd,
    windowPayload.fetchStart
  );

  return {
    visibleBases: windowPayload.bases.slice(startIndex, endIndexExclusive),
    visibleForwardFn: windowPayload.forwardFn.slice(startIndex, endIndexExclusive),
    visibleReverseFn: windowPayload.reverseFn.slice(startIndex, endIndexExclusive),
    visibleForwardActivity: windowPayload.forwardActivity.slice(startIndex, endIndexExclusive),
    visibleReverseActivity: windowPayload.reverseActivity.slice(startIndex, endIndexExclusive)
  };
};

const buildFallbackPayload = (accession: string, selectedCoordinate: number): ViewerPayload => {
  const center = Math.max(1, Math.trunc(selectedCoordinate));

  return {
    accession,
    genomeLength: 1,
    region: {
      start: center,
      end: center,
      center
    },
    fetchRange: {
      start: center,
      end: center
    },
    visibleLength: 0,
    bufferLeft: 0,
    bufferRight: 0,
    bases: "",
    forwardFn: "",
    reverseFn: "",
    forwardActivity: [],
    reverseActivity: [],
    visibleBases: "",
    visibleForwardFn: "",
    visibleReverseFn: "",
    visibleForwardActivity: [],
    visibleReverseActivity: []
  };
};

export const loadViewerPayload = async (
  accession: string,
  selectedCoordinate: number
): Promise<ViewerPayload> => {
  const query = new URLSearchParams({
    accession,
    center: String(Math.max(1, Math.trunc(selectedCoordinate)))
  });

  try {
    const endpoint = new URL(`/api/v1/viewer/window?${query.toString()}`, "http://localhost");
    const response = await fetch(endpoint.toString());

    if (!response.ok) {
      throw new Error(`Viewer payload request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ViewerWindowResponse;
    const visibleWindow = buildVisibleWindow(payload);

    return {
      accession: payload.sequenceId,
      genomeLength: payload.genomeLength,
      region: {
        start: payload.visibleStart,
        end: payload.visibleEnd,
        center: payload.requestedCenter
      },
      fetchRange: {
        start: payload.fetchStart,
        end: payload.fetchEnd
      },
      visibleLength: payload.visibleLength,
      bufferLeft: payload.bufferLeft,
      bufferRight: payload.bufferRight,
      bases: payload.bases,
      forwardFn: payload.forwardFn,
      reverseFn: payload.reverseFn,
      forwardActivity: payload.forwardActivity,
      reverseActivity: payload.reverseActivity,
      ...visibleWindow
    };
  } catch {
    return buildFallbackPayload(accession, selectedCoordinate);
  }
};
