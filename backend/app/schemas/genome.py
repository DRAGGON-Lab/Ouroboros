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
