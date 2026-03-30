import json
from pathlib import Path

from app.main import app
from app.schemas import AnnotationFeature, AnnotationListResponse, GenomeRegionResponse

ROOT = Path(__file__).resolve().parents[2]
CONTRACT_DIR = ROOT / "shared" / "api-contract"
SCHEMAS_DIR = CONTRACT_DIR / "schemas"


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def main() -> None:
    _write_json(CONTRACT_DIR / "openapi.json", app.openapi())
    _write_json(
        SCHEMAS_DIR / "GenomeRegionResponse.schema.json",
        GenomeRegionResponse.model_json_schema(),
    )
    _write_json(
        SCHEMAS_DIR / "AnnotationFeature.schema.json",
        AnnotationFeature.model_json_schema(),
    )
    _write_json(
        SCHEMAS_DIR / "AnnotationListResponse.schema.json",
        AnnotationListResponse.model_json_schema(),
    )


if __name__ == "__main__":
    main()
