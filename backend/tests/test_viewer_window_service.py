from app.services.viewer_window import (
    WindowMetadata,
    build_viewer_window_encoding,
    clamp_activity,
    complement_base,
    resolve_function_precedence,
)


def test_complement_base_mapping_and_unknown_handling() -> None:
    assert complement_base("A") == "T"
    assert complement_base("t") == "A"
    assert complement_base("C") == "G"
    assert complement_base("g") == "C"
    assert complement_base("-") == "-"
    assert complement_base("N") == "-"


def test_function_precedence_resolver_is_deterministic() -> None:
    assert resolve_function_precedence("-", "C") == "C"
    assert resolve_function_precedence("C", "P") == "P"
    assert resolve_function_precedence("P", "C") == "P"
    assert resolve_function_precedence("-", "X") == "-"


def test_clamp_activity_limits_values_to_supported_range() -> None:
    assert clamp_activity(-0.4) == 0.0
    assert clamp_activity(0.75) == 0.75
    assert clamp_activity(4.0) == 2.0


def test_build_viewer_window_encoding_outputs_expected_content_and_lengths() -> None:
    metadata = WindowMetadata(fetch_start=10, fetch_end=14, visible_start=11, visible_end=13)
    sequence_slice = "ACGTN"
    annotations = [
        {"start": 10, "end": 12, "strand": "forward", "type": "CDS"},
        {"start": 11, "end": 11, "strand": "forward", "type": "promoter", "promoter_activity": 3.5},
        {"start": 13, "end": 14, "strand": "reverse", "type": "promoter", "promoter_activity": -1.0},
    ]

    encoded = build_viewer_window_encoding(
        sequence_slice=sequence_slice,
        annotations=annotations,
        metadata=metadata,
    )

    assert encoded["bases"] == "ACGT-"
    assert encoded["forwardFn"] == "CPC--"
    assert encoded["reverseFn"] == "---PP"
    assert encoded["forwardActivity"] == [0.0, 2.0, 0.0, 0.0, 0.0]
    assert encoded["reverseActivity"] == [0.0, 0.0, 0.0, 0.0, 0.0]

    expected_length = metadata.fetch_end - metadata.fetch_start + 1
    assert len(encoded["bases"]) == expected_length
    assert len(encoded["forwardFn"]) == expected_length
    assert len(encoded["reverseFn"]) == expected_length
    assert len(encoded["forwardActivity"]) == expected_length
    assert len(encoded["reverseActivity"]) == expected_length
