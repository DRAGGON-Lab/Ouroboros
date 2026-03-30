from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    ActivityType,
    AnnotationFeature,
    AnnotationListResponse,
    AnnotationSource,
    GenomeRegionResponse,
    Strand,
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


@router.get("/genome/region", response_model=GenomeRegionResponse, tags=["genome"])
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


@router.get("/annotations", response_model=AnnotationListResponse, tags=["annotations"])
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
