from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    ActivityType,
    AnnotationFeature,
    AnnotationListResponse,
    AnnotationSource,
    GenomeRegionResponse,
    SequenceAnnotation,
    Strand,
    ViewerSequenceResponse,
    ViewerWindowResponse,
)
from app.services.sequence_loader import load_example_plasmid_sequence, load_example_sequence
from app.services.viewer_window import WindowMetadata, build_viewer_window_encoding

router = APIRouter()

SUPPORTED_ACCESSION = "U00096.3"
GENOME_LENGTH = 4_641_652
PROMOTER_MOTIF = "TTGACAGCTAGCTCAGTCCTAGGTACTGTGCTAGC"
CDS_MOTIFS = [
    (
        "cds_1",
        "ATGCGTAAAGGAGAAGAACTTTTCACTGGAGTTGTCCCAATTCTTGTTGAATTAGATGGTGATGTTAATGGGCACAAATTTTCTGTCAGTGGAGAGGGTGAAGGTGATGCAACATACGGAAAACTTACCCTTAAATTTATTTGCACTACTGGAAAACTACCTGTTCCATGGCCAACACTTGTCACTACTTTCGGTTATGGTGTTCAATGCTTTGCGAGATACCCAGATCATATGAAACAGCATGACTTTTTCAAGAGTGCCATGCCCGAAGGTTATGTACAGGAAAGAACTATATTTTTCAAAGATGACGGGAACTACAAGACACGTGCTGAAGTCAAGTTTGAAGGTGATACCCTTGTTAATAGAATCGAGTTAAAAGGTATTGATTTTAAAGAAGATGGAAACATTCTTGGACACAAATTGGAATACAACTATAACTCACACAATGTATACATCATGGCAGACAAACAAAAGAATGGAATCAAAGTTAACTTCAAAATTAGACACAACATTGAAGATGGAAGCGTTCAACTAGCAGACCATTATCAACAAAATACTCCAATTGGCGATGGCCCTGTCCTTTTACCAGACAACCATTACCTGTCCACACAATCTGCCCTTTCGAAAGATCCCAACGAAAAGAGAGACTACATGGTCCTTCTTGAGTTTGTAACAGCTGCTGGGATTACACATGGCATGGATGAACTATACAAA",
    ),
    (
        "cds_2",
        "ATGGCTTCCTCCGAGGATGTTATCAAAGAGTTCATGCGTTTCAAAGTTCGTATGGAAGGTTCCGTTAACGGTCACGAGTTCGAAATCGAAGGTGAAGGTGAAGGTCGTCCGTACGAAGGTACCCAGACCGCTAAACTGAAAGTTACCAAAGGTGGTCCGCTGCCGTTCGCTTGGGACATCCTGTCCCCGCAGTTCCAGTACGGTTCCAAAGCTTACGTTAAACACCCGGCTGACATCCCGGACTACCTGAAACTGTCCTTCCCGGAAGGTTTCAAATGGGAACGTGTTATGAACTTCGAAGATGGTGGTGTTGTTACCGTTACCCAGGACTCCTCCCTGCAAGACGGTGAGTTCATCTACAAAGTTAAACTGCGTGGTACCAACTTCCCGTCCGACGGTCCGGTTATGCAGAAAAAAACCATGGGTTGGGAAGCTTCCACCGAACGTATGTACCCGGAGGATGGTGCTCTGAAAGGTGAAATCAAAATGCGTCTGAAACTGAAAGACGGTGGTCACTACGACGCTGAAGTTAAAACCACCTACATGGCTAAAAAACCGGTTCAGCTGCCGGGTGCTTACAAAACCGACATCAAACTGGACATCACCTCCCACAACGAGGACTACACCATCGTTGAACAGTACGAACGTGCTGAAGGTCGTCACTCCACCGGTGCTTAA",
    ),
]

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


def _build_processed_annotations(sequence: str) -> list[SequenceAnnotation]:
    compact_sequence = sequence.upper()
    annotations: list[SequenceAnnotation] = []

    promoter_starts = _find_overlapping_matches(compact_sequence, PROMOTER_MOTIF)
    for index, start in enumerate(promoter_starts):
        annotations.append(
            SequenceAnnotation(
                id=f"promoter_{index + 1}",
                type="promoter",
                label=f"promoter_match_{index + 1}",
                start=start,
                end=start + len(PROMOTER_MOTIF) - 1,
                strand=Strand.forward,
                annotation_source=AnnotationSource.inferred,
                activity_type=ActivityType.predicted,
            )
        )

    for cds_id, motif in CDS_MOTIFS:
        for index, start in enumerate(_find_overlapping_matches(compact_sequence, motif)):
            annotations.append(
                SequenceAnnotation(
                    id=f"{cds_id}_{index + 1}",
                    type="CDS",
                    label=f"{cds_id}_match_{index + 1}",
                    start=start,
                    end=start + len(motif) - 1,
                    strand=Strand.forward,
                    annotation_source=AnnotationSource.inferred,
                    activity_type=ActivityType.predicted,
                )
            )

    return sorted(annotations, key=lambda feature: feature.start)


def _find_overlapping_matches(sequence: str, motif: str) -> list[int]:
    matches: list[int] = []
    start_index = 0

    while True:
        found_index = sequence.find(motif, start_index)
        if found_index == -1:
            break

        matches.append(found_index + 1)
        start_index = found_index + 1

    return matches


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


def _viewer_annotations_in_range(start: int, end: int) -> list[dict[str, int | str | float]]:
    annotations: list[dict[str, int | str | float]] = []
    for feature in _annotations_in_range(start, end):
        annotation = {
            "start": feature.start,
            "end": feature.end,
            "strand": feature.strand.value,
            "type": feature.type,
        }
        if feature.type.lower() == "promoter":
            annotation["promoter_activity"] = 1.7
        annotations.append(annotation)
    return annotations


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
    sequence_slice = _mock_sequence(fetch_start, fetch_end)
    encoding = build_viewer_window_encoding(
        sequence_slice=sequence_slice,
        annotations=_viewer_annotations_in_range(fetch_start, fetch_end),
        metadata=WindowMetadata(
            fetch_start=fetch_start,
            fetch_end=fetch_end,
            visible_start=visible_start,
            visible_end=visible_end,
        ),
    )

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
        bases=encoding["bases"],
        forwardFn=encoding["forwardFn"],
        reverseFn=encoding["reverseFn"],
        forwardActivity=encoding["forwardActivity"],
        reverseActivity=encoding["reverseActivity"],
    )


@router.get(
    "/viewer/sequence",
    response_model=ViewerSequenceResponse,
    tags=["viewer"],
    responses={
        400: {"description": "Unsupported sequence source."},
    },
)
def get_viewer_sequence(
    source: str = Query(
        "example_sequence",
        description="Sequence source: example_sequence or example_plasmid",
    ),
) -> ViewerSequenceResponse:
    if source == "example_sequence":
        sequence_id, sequence = load_example_sequence()
    elif source == "example_plasmid":
        sequence_id, sequence = load_example_plasmid_sequence()
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported sequence source. Use 'example_sequence' or 'example_plasmid'.",
        )

    return ViewerSequenceResponse(
        source=source,
        sequenceId=sequence_id,
        sequence=sequence,
        length=len(sequence),
        annotations=_build_processed_annotations(sequence),
    )
