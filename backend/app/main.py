from fastapi import FastAPI

from app.api.v1.routes import router as v1_router
from app.core.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(v1_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Ouroboros backend is running"}
