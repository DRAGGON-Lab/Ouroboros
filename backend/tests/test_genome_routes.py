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
