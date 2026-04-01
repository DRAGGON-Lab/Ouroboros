from pathlib import Path

from Bio import SeqIO
from fastapi import HTTPException

from app.schemas import ActivityType, AnnotationFeature, AnnotationSource, Strand

EXAMPLE_SEQUENCE_ID = "example-sequence"
EXAMPLE_SEQUENCE_LENGTH = 1_011
EXAMPLE_SEQUENCE = ("ACGT" * ((EXAMPLE_SEQUENCE_LENGTH // 4) + 1))[:EXAMPLE_SEQUENCE_LENGTH]

EXAMPLE_PLASMID_ID = "example-plasmid"
EXAMPLE_PLASMID_PATH = Path(__file__).resolve().parents[3] / "data" / "raw" / "addgene-plasmid-66061-sequence-119876.gbk"
PROMOTER_MOTIF = "TTGACAGCTAGCTCAGTCCTAGGTACTGTGCTAGC"
CDS_SEQUENCES: tuple[tuple[str, str], ...] = (
    (
        "mock_cds_1",
        "ATGCGTAAAGGAGAAGAACTTTTCACTGGAGTTGTCCCAATTCTTGTTGAATTAGATGGTGATGTTAATGGGCACAAATTTTCTGTCAGTGGAGAGGGTGAAGGTGATGCAACATACGGAAAACTTACCCTTAAATTTATTTGCACTACTGGAAAACTACCTGTTCCATGGCCAACACTTGTCACTACTTTCGGTTATGGTGTTCAATGCTTTGCGAGATACCCAGATCATATGAAACAGCATGACTTTTTCAAGAGTGCCATGCCCGAAGGTTATGTACAGGAAAGAACTATATTTTTCAAAGATGACGGGAACTACAAGACACGTGCTGAAGTCAAGTTTGAAGGTGATACCCTTGTTAATAGAATCGAGTTAAAAGGTATTGATTTTAAAGAAGATGGAAACATTCTTGGACACAAATTGGAATACAACTATAACTCACACAATGTATACATCATGGCAGACAAACAAAAGAATGGAATCAAAGTTAACTTCAAAATTAGACACAACATTGAAGATGGAAGCGTTCAACTAGCAGACCATTATCAACAAAATACTCCAATTGGCGATGGCCCTGTCCTTTTACCAGACAACCATTACCTGTCCACACAATCTGCCCTTTCGAAAGATCCCAACGAAAAGAGAGACTACATGGTCCTTCTTGAGTTTGTAACAGCTGCTGGGATTACACATGGCATGGATGAACTATACAAA",
    ),
    (
        "mock_cds_2",
        "ATGGCTTCCTCCGAGGATGTTATCAAAGAGTTCATGCGTTTCAAAGTTCGTATGGAAGGTTCCGTTAACGGTCACGAGTTCGAAATCGAAGGTGAAGGTGAAGGTCGTCCGTACGAAGGTACCCAGACCGCTAAACTGAAAGTTACCAAAGGTGGTCCGCTGCCGTTCGCTTGGGACATCCTGTCCCCGCAGTTCCAGTACGGTTCCAAAGCTTACGTTAAACACCCGGCTGACATCCCGGACTACCTGAAACTGTCCTTCCCGGAAGGTTTCAAATGGGAACGTGTTATGAACTTCGAAGATGGTGGTGTTGTTACCGTTACCCAGGACTCCTCCCTGCAAGACGGTGAGTTCATCTACAAAGTTAAACTGCGTGGTACCAACTTCCCGTCCGACGGTCCGGTTATGCAGAAAAAAACCATGGGTTGGGAAGCTTCCACCGAACGTATGTACCCGGAGGATGGTGCTCTGAAAGGTGAAATCAAAATGCGTCTGAAACTGAAAGACGGTGGTCACTACGACGCTGAAGTTAAAACCACCTACATGGCTAAAAAACCGGTTCAGCTGCCGGGTGCTTACAAAACCGACATCAAACTGGACATCACCTCCCACAACGAGGACTACACCATCGTTGAACAGTACGAACGTGCTGAAGGTCGTCACTCCACCGGTGCTTAA",
    ),
)


def load_example_sequence() -> tuple[str, str]:
    return EXAMPLE_SEQUENCE_ID, EXAMPLE_SEQUENCE


def _find_occurrences(sequence: str, query: str) -> list[tuple[int, int]]:
    matches: list[tuple[int, int]] = []
    cursor = 0

    while cursor <= len(sequence) - len(query):
        offset = sequence.find(query, cursor)
        if offset < 0:
            break
        start = offset + 1
        end = start + len(query) - 1
        matches.append((start, end))
        cursor = offset + 1

    return matches


def build_mock_processed_annotations(sequence: str) -> list[AnnotationFeature]:
    annotations: list[AnnotationFeature] = []

    for index, (start, end) in enumerate(_find_occurrences(sequence, PROMOTER_MOTIF), start=1):
        annotations.append(
            AnnotationFeature(
                id=f"mock_promoter_{index}",
                type="promoter",
                start=start,
                end=end,
                strand=Strand.forward,
                label=f"Promoter {index}",
                annotation_source=AnnotationSource.inferred,
                activity_type=ActivityType.predicted,
            )
        )

    for cds_id, cds_sequence in CDS_SEQUENCES:
        for index, (start, end) in enumerate(_find_occurrences(sequence, cds_sequence), start=1):
            annotations.append(
                AnnotationFeature(
                    id=f"{cds_id}_{index}",
                    type="CDS",
                    start=start,
                    end=end,
                    strand=Strand.forward,
                    label=f"CDS {cds_id.split('_')[-1]}",
                    annotation_source=AnnotationSource.inferred,
                    activity_type=ActivityType.predicted,
                )
            )

    return sorted(annotations, key=lambda feature: feature.start)


def load_example_plasmid_sequence() -> tuple[str, str]:
    if not EXAMPLE_PLASMID_PATH.exists():
        raise HTTPException(status_code=500, detail="Example plasmid file is not available on the backend.")

    record = SeqIO.read(EXAMPLE_PLASMID_PATH, "genbank")
    sequence = str(record.seq).upper()

    if not sequence:
        raise HTTPException(status_code=500, detail="Example plasmid sequence is empty.")

    return EXAMPLE_PLASMID_ID, sequence
