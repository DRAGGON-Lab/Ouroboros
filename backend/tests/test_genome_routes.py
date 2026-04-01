from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_genome_region_success() -> None:
    response = client.get(
        "/api/v1/genome/region",
        params={"accession": "U00096.3", "start": 190, "end": 210},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["accession"] == "U00096.3"
    assert payload["start"] == 190
    assert payload["end"] == 210
    assert payload["strand"] == "forward"
    assert payload["sequence"] == "CGTACGTACGTACGTACGTAC"
    assert payload["activity_type"] == "measured"
    assert len(payload["annotations"]) >= 1
    first_annotation = payload["annotations"][0]
    assert first_annotation["annotation_source"] in {"curated", "inferred"}
    assert first_annotation["activity_type"] in {"measured", "predicted"}


def test_get_annotations_success() -> None:
    response = client.get(
        "/api/v1/annotations",
        params={"accession": "U00096.3", "start": 295, "end": 340},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["accession"] == "U00096.3"
    assert payload["start"] == 295
    assert payload["end"] == 340
    assert len(payload["annotations"]) == 2
    assert payload["annotations"][1]["strand"] == "reverse"


def test_get_genome_region_invalid_range_returns_400() -> None:
    response = client.get(
        "/api/v1/genome/region",
        params={"accession": "U00096.3", "start": 500, "end": 100},
    )

    assert response.status_code == 400
    assert "Invalid coordinate range" in response.json()["detail"]


def test_get_annotations_accession_mismatch_returns_404() -> None:
    response = client.get(
        "/api/v1/annotations",
        params={"accession": "NC_000913.3", "start": 1, "end": 100},
    )

    assert response.status_code == 404
    assert "Unsupported accession" in response.json()["detail"]


def test_openapi_declares_400_and_404_for_mock_validation_errors() -> None:
    openapi = client.get("/openapi.json").json()
    paths = openapi["paths"]

    genome_responses = paths["/api/v1/genome/region"]["get"]["responses"]
    annotations_responses = paths["/api/v1/annotations"]["get"]["responses"]

    for responses in (genome_responses, annotations_responses):
        assert "400" in responses
        assert responses["400"]["description"] == "Invalid coordinate range."
        assert "404" in responses
        assert responses["404"]["description"] == "Unsupported accession."


def test_get_viewer_window_success_shape_and_lengths() -> None:
    response = client.get(
        "/api/v1/viewer/window",
        params={"accession": "U00096.3", "center": 2_000},
    )

    assert response.status_code == 200
    payload = response.json()

    assert payload["sequenceId"] == "U00096.3"
    assert payload["genomeLength"] == 4_641_652
    assert payload["visibleLength"] == 1_000
    assert payload["bufferLeft"] == 250
    assert payload["bufferRight"] == 250

    fetch_len = payload["fetchEnd"] - payload["fetchStart"] + 1
    assert len(payload["bases"]) == fetch_len
    assert len(payload["forwardFn"]) == fetch_len
    assert len(payload["reverseFn"]) == fetch_len
    assert len(payload["forwardActivity"]) == fetch_len
    assert len(payload["reverseActivity"]) == fetch_len

    assert set(payload["bases"]).issubset({"A", "C", "G", "T", "-"})
    assert set(payload["forwardFn"]).issubset({"P", "C", "-"})
    assert set(payload["reverseFn"]).issubset({"P", "C", "-"})

    assert payload["fetchStart"] <= payload["visibleStart"] <= payload["visibleEnd"] <= payload["fetchEnd"]
    assert payload["visibleEnd"] - payload["visibleStart"] + 1 <= payload["visibleLength"]

    for value in payload["forwardActivity"] + payload["reverseActivity"]:
        assert isinstance(value, (int, float))
        assert 0 <= value <= 2


def test_get_viewer_window_start_boundary_behavior() -> None:
    response = client.get(
        "/api/v1/viewer/window",
        params={"accession": "U00096.3", "center": 1},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["requestedCenter"] == 1
    assert payload["visibleStart"] == 1
    assert payload["fetchStart"] == 1
    assert payload["visibleEnd"] == 1_000
    assert payload["fetchEnd"] == 1_250


def test_get_viewer_window_end_boundary_behavior() -> None:
    response = client.get(
        "/api/v1/viewer/window",
        params={"accession": "U00096.3", "center": 4_641_652},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["requestedCenter"] == 4_641_652
    assert payload["visibleEnd"] == 4_641_652
    assert payload["fetchEnd"] == 4_641_652
    assert payload["visibleStart"] == 4_640_653
    assert payload["fetchStart"] == 4_640_403
