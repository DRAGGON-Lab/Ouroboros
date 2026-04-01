from enum import Enum

from pydantic import BaseModel, Field


class Strand(str, Enum):
    forward = "forward"
    reverse = "reverse"


class AnnotationSource(str, Enum):
    curated = "curated"
    inferred = "inferred"


class ActivityType(str, Enum):
    measured = "measured"
    predicted = "predicted"


class AnnotationFeature(BaseModel):
    id: str
    type: str = Field(description="Feature type (gene, CDS, promoter, etc.)")
    start: int = Field(ge=1)
    end: int = Field(ge=1)
    strand: Strand
    label: str
    annotation_source: AnnotationSource = Field(
        description="Distinguishes curated annotations from inferred annotations"
    )
    activity_type: ActivityType = Field(
        description="Indicates whether activity metadata is measured or predicted"
    )


class GenomeRegionResponse(BaseModel):
    accession: str
    start: int = Field(ge=1)
    end: int = Field(ge=1)
    strand: Strand
    sequence: str = Field(pattern="^[ACGTNacgtn]+$")
    activity_type: ActivityType
    annotations: list[AnnotationFeature]


class AnnotationListResponse(BaseModel):
    accession: str
    start: int = Field(ge=1)
    end: int = Field(ge=1)
    annotations: list[AnnotationFeature]


class ViewerWindowResponse(BaseModel):
    sequenceId: str
    genomeLength: int = Field(ge=1)
    requestedCenter: int = Field(ge=1)
    visibleStart: int = Field(ge=1)
    visibleEnd: int = Field(ge=1)
    fetchStart: int = Field(ge=1)
    fetchEnd: int = Field(ge=1)
    visibleLength: int = Field(ge=1)
    bufferLeft: int = Field(ge=0)
    bufferRight: int = Field(ge=0)
    bases: str = Field(pattern=r"^[ACGT-]+$")
    forwardFn: str = Field(pattern=r"^[PC-]+$")
    reverseFn: str = Field(pattern=r"^[PC-]+$")
    forwardActivity: list[float]
    reverseActivity: list[float]


class ViewerSequenceResponse(BaseModel):
    source: str
    sequenceId: str
    sequence: str = Field(pattern=r"^[ACGTN-]+$")
    length: int = Field(ge=1)
