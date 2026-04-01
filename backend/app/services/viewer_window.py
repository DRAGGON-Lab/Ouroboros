from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class WindowMetadata:
    """Coordinates describing the fetched and visible genomic window.

    This service is intentionally format-focused: it encodes per-base viewer arrays
    from already-parsed sequence/annotation inputs. It does not infer biological
    confidence classes (e.g., measured vs predicted activity) or annotation curation
    state (curated vs inferred); those metadata distinctions remain in the source
    annotation layer.
    """

    fetch_start: int
    fetch_end: int
    visible_start: int
    visible_end: int


_FUNCTION_PRECEDENCE: dict[str, int] = {"-": 0, "C": 1, "P": 2}
_COMPLEMENT_MAP: dict[str, str] = {
    "A": "T",
    "T": "A",
    "C": "G",
    "G": "C",
    "-": "-",
}


def clamp_activity(value: float) -> float:
    """Clamp promoter activity to the viewer-supported interval [0, 2]."""

    return max(0.0, min(2.0, float(value)))


def complement_base(base: str) -> str:
    """Return DNA complement for one base, mapping unknown symbols to '-' ."""

    return _COMPLEMENT_MAP.get(base.upper(), "-")


def resolve_function_precedence(current: str, candidate: str) -> str:
    """Resolve function code conflicts with deterministic precedence P > C > -."""

    current_code = current if current in _FUNCTION_PRECEDENCE else "-"
    candidate_code = candidate if candidate in _FUNCTION_PRECEDENCE else "-"

    if _FUNCTION_PRECEDENCE[candidate_code] > _FUNCTION_PRECEDENCE[current_code]:
        return candidate_code
    return current_code


def _normalize_base(base: str) -> str:
    upper = base.upper()
    return upper if upper in {"A", "C", "G", "T"} else "-"


def _annotation_to_code(annotation_type: str) -> str:
    annotation_type_lower = annotation_type.lower()
    if annotation_type_lower == "promoter":
        return "P"
    if annotation_type_lower == "cds":
        return "C"
    return "-"


def build_viewer_window_encoding(
    sequence_slice: str,
    annotations: Sequence[Any],
    metadata: WindowMetadata,
) -> dict[str, str | list[float]]:
    """Build deterministic per-base encoding arrays for the viewer fetch window.

    Args:
        sequence_slice: Sequence string for [fetch_start, fetch_end] (inclusive).
        annotations: Overlapping features with start/end/strand/type and optional
            promoter activity metadata (either `promoter_activity` or
            `activity_value`).
        metadata: Window coordinates used to align per-base arrays.

    Returns:
        Mapping with compact arrays/strings: bases, forwardFn, reverseFn,
        forwardActivity, reverseActivity.
    """

    expected_length = metadata.fetch_end - metadata.fetch_start + 1
    if len(sequence_slice) != expected_length:
        raise ValueError(
            "sequence_slice length does not match fetch window span: "
            f"len={len(sequence_slice)} expected={expected_length}"
        )

    bases = "".join(_normalize_base(base) for base in sequence_slice)
    forward_fn = ["-"] * expected_length
    reverse_fn = ["-"] * expected_length
    forward_activity = [0.0] * expected_length
    reverse_activity = [0.0] * expected_length

    for annotation in annotations:
        start = int(getattr(annotation, "start", None) or annotation["start"])
        end = int(getattr(annotation, "end", None) or annotation["end"])
        annotation_type = str(getattr(annotation, "type", None) or annotation["type"])
        strand = str(getattr(annotation, "strand", None) or annotation["strand"])

        code = _annotation_to_code(annotation_type)
        is_forward = strand == "forward"

        overlap_start = max(start, metadata.fetch_start)
        overlap_end = min(end, metadata.fetch_end)
        if overlap_start > overlap_end:
            continue

        raw_activity = getattr(annotation, "promoter_activity", None)
        if raw_activity is None and isinstance(annotation, Mapping):
            raw_activity = annotation.get("promoter_activity", annotation.get("activity_value"))
        elif raw_activity is None:
            raw_activity = getattr(annotation, "activity_value", None)

        activity_value = clamp_activity(raw_activity) if raw_activity is not None else 0.0

        for position in range(overlap_start, overlap_end + 1):
            offset = position - metadata.fetch_start
            if is_forward:
                chosen = resolve_function_precedence(forward_fn[offset], code)
                forward_fn[offset] = chosen
                if code == "P" and chosen == "P":
                    forward_activity[offset] = max(forward_activity[offset], activity_value)
            else:
                chosen = resolve_function_precedence(reverse_fn[offset], code)
                reverse_fn[offset] = chosen
                if code == "P" and chosen == "P":
                    reverse_activity[offset] = max(reverse_activity[offset], activity_value)

    return {
        "bases": bases,
        "forwardFn": "".join(forward_fn),
        "reverseFn": "".join(reverse_fn),
        "forwardActivity": forward_activity,
        "reverseActivity": reverse_activity,
    }
