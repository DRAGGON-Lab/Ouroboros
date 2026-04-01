from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_get_example_sequence_default() -> None:
    response = client.get("/api/v1/viewer/sequence")

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "example_sequence"
    assert payload["sequenceId"] == "example-sequence"
    assert payload["length"] == 1_011
    assert len(payload["sequence"]) == 1_011


def test_get_example_plasmid_sequence() -> None:
    response = client.get("/api/v1/viewer/sequence", params={"source": "example_plasmid"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["source"] == "example_plasmid"
    assert payload["sequenceId"] == "example-plasmid"
    assert payload["length"] == len(payload["sequence"])
    assert payload["length"] > 1_011


def test_get_sequence_invalid_source_returns_400() -> None:
    response = client.get("/api/v1/viewer/sequence", params={"source": "unknown"})

    assert response.status_code == 400
    assert "Unsupported sequence source" in response.json()["detail"]
