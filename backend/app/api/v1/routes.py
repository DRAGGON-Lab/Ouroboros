from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    ActivityType,
    AnnotationFeature,
    AnnotationListResponse,
    AnnotationSource,
    GenomeRegionResponse,
    Strand,
    ViewerWindowResponse,
)

router = APIRouter()

SUPPORTED_ACCESSION = "U00096.3"
GENOME_LENGTH = 4_641_652

MOCK_ANNOTATIONS: list[AnnotationFeature] = [
    AnnotationFeature(
        id="b0001",
        type="gene",
        start=190,
        end=255,
        strand=Strand.forward,
        label="thrL",
        annotation_source=AnnotationSource.curated,
        activity_type=ActivityType.measured,
    ),
    AnnotationFeature(
        id="b0002",
        type="CDS",
        start=337,
        end=2799,
        strand=Strand.forward,
        label="thrA",
        annotation_source=AnnotationSource.curated,
        activity_type=ActivityType.measured,
    ),
    AnnotationFeature(
        id="pred_prom_0001",
        type="promoter",
        start=300,
        end=330,
        strand=Strand.reverse,
        label="thrLABC_promoter_candidate",
        annotation_source=AnnotationSource.inferred,
        activity_type=ActivityType.predicted,
    ),
]


@router.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


def _validate_accession(accession: str) -> None:
    if accession != SUPPORTED_ACCESSION:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Unsupported accession '{accession}'. "
                f"Only '{SUPPORTED_ACCESSION}' is available in mock mode."
            ),
        )


def _validate_coordinate_range(start: int, end: int) -> None:
    if start > end:
        raise HTTPException(
            status_code=400,
            detail="Invalid coordinate range: start must be less than or equal to end.",
        )
    if end > GENOME_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid coordinate range: end exceeds genome length "
                f"for {SUPPORTED_ACCESSION} ({GENOME_LENGTH})."
            ),
        )


def _mock_sequence(start: int, end: int) -> str:
    bases = "ACGT"
    return "".join(bases[(position - 1) % len(bases)] for position in range(start, end + 1))


def _annotations_in_range(start: int, end: int) -> list[AnnotationFeature]:
    return [
        feature
        for feature in MOCK_ANNOTATIONS
        if feature.start <= end and feature.end >= start
    ]


def _clamp(value: int, lower: int, upper: int) -> int:
    return max(lower, min(value, upper))


def _mock_function_track(start: int, end: int, *, reverse: bool = False) -> str:
    codes = "PC--"
    return "".join(
        codes[((position - 1) + (1 if reverse else 0)) % len(codes)]
        for position in range(start, end + 1)
    )


def _mock_activity_track(start: int, end: int, *, reverse: bool = False) -> list[float]:
    values = [0.0, 0.5, 1.0, 1.5, 2.0]
    return [
        values[((position - 1) + (2 if reverse else 0)) % len(values)]
        for position in range(start, end + 1)
    ]


@router.get(
    "/genome/region",
    response_model=GenomeRegionResponse,
    tags=["genome"],
    responses={
        400: {"description": "Invalid coordinate range."},
        404: {"description": "Unsupported accession."},
    },
)
def get_genome_region(
    accession: str = Query(..., description="Genome accession; mock API supports U00096.3"),
    start: int = Query(..., ge=1, description="1-based inclusive start coordinate"),
    end: int = Query(..., ge=1, description="1-based inclusive end coordinate"),
) -> GenomeRegionResponse:
    _validate_accession(accession)
    _validate_coordinate_range(start, end)

    return GenomeRegionResponse(
        accession=accession,
        start=start,
        end=end,
        strand=Strand.forward,
        sequence=_mock_sequence(start, end),
        activity_type=ActivityType.measured,
        annotations=_annotations_in_range(start, end),
    )


@router.get(
    "/annotations",
    response_model=AnnotationListResponse,
    tags=["annotations"],
    responses={
        400: {"description": "Invalid coordinate range."},
        404: {"description": "Unsupported accession."},
    },
)
def get_annotations(
    accession: str = Query(..., description="Genome accession; mock API supports U00096.3"),
    start: int = Query(..., ge=1, description="1-based inclusive start coordinate"),
    end: int = Query(..., ge=1, description="1-based inclusive end coordinate"),
) -> AnnotationListResponse:
    _validate_accession(accession)
    _validate_coordinate_range(start, end)

    return AnnotationListResponse(
        accession=accession,
        start=start,
        end=end,
        annotations=_annotations_in_range(start, end),
    )


@router.get(
    "/viewer/window",
    response_model=ViewerWindowResponse,
    tags=["viewer"],
    responses={
        404: {"description": "Unsupported accession."},
    },
)
def get_viewer_window(
    accession: str = Query(..., description="Genome accession; mock API supports U00096.3"),
    center: int = Query(..., ge=1, description="1-based center coordinate for the visible window"),
) -> ViewerWindowResponse:
    visible_length = 1_000
    buffer_left = 250
    buffer_right = 250

    _validate_accession(accession)

    requested_center = _clamp(center, 1, GENOME_LENGTH)
    half_window_left = visible_length // 2
    visible_start = _clamp(requested_center - half_window_left, 1, GENOME_LENGTH)
    visible_end = _clamp(visible_start + visible_length - 1, 1, GENOME_LENGTH)
    visible_start = _clamp(visible_end - visible_length + 1, 1, GENOME_LENGTH)

    fetch_start = _clamp(visible_start - buffer_left, 1, GENOME_LENGTH)
    fetch_end = _clamp(visible_end + buffer_right, 1, GENOME_LENGTH)

    return ViewerWindowResponse(
        sequenceId=accession,
        genomeLength=GENOME_LENGTH,
        requestedCenter=requested_center,
        visibleStart=visible_start,
        visibleEnd=visible_end,
        fetchStart=fetch_start,
        fetchEnd=fetch_end,
        visibleLength=visible_length,
        bufferLeft=buffer_left,
        bufferRight=buffer_right,
        bases=_mock_sequence(fetch_start, fetch_end).replace("N", "-"),
        forwardFn=_mock_function_track(fetch_start, fetch_end),
        reverseFn=_mock_function_track(fetch_start, fetch_end, reverse=True),
        forwardActivity=_mock_activity_track(fetch_start, fetch_end),
        reverseActivity=_mock_activity_track(fetch_start, fetch_end, reverse=True),
    )
