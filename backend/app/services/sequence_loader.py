from pathlib import Path

from Bio import SeqIO
from fastapi import HTTPException

EXAMPLE_SEQUENCE_ID = "example-sequence"
EXAMPLE_SEQUENCE_LENGTH = 1_011
EXAMPLE_SEQUENCE = ("ACGT" * ((EXAMPLE_SEQUENCE_LENGTH // 4) + 1))[:EXAMPLE_SEQUENCE_LENGTH]

EXAMPLE_PLASMID_ID = "example-plasmid"
EXAMPLE_PLASMID_PATH = Path(__file__).resolve().parents[3] / "data" / "raw" / "addgene-plasmid-66061-sequence-119876.gbk"


def load_example_sequence() -> tuple[str, str]:
    return EXAMPLE_SEQUENCE_ID, EXAMPLE_SEQUENCE


def load_example_plasmid_sequence() -> tuple[str, str]:
    if not EXAMPLE_PLASMID_PATH.exists():
        raise HTTPException(status_code=500, detail="Example plasmid file is not available on the backend.")

    record = SeqIO.read(EXAMPLE_PLASMID_PATH, "genbank")
    sequence = str(record.seq).upper()

    if not sequence:
        raise HTTPException(status_code=500, detail="Example plasmid sequence is empty.")

    return EXAMPLE_PLASMID_ID, sequence
