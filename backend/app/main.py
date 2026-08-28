from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_current import router as current_router
from app.api.routes_instruments import router as instruments_router
from app.api.routes_model import router as model_router
from app.schemas.model import HealthResponse

app = FastAPI(
    title="Ocean3D API",
    version="0.1.0",
    description=(
        "Ocean3D backend for synthetic Indian Ocean model fields and instrument "
        "observations. Model data is deterministic and intended for MVP visualization."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(model_router)
app.include_router(current_router)
app.include_router(instruments_router)


@app.get("/", tags=["System"])
def root():
    return {"name": "Ocean3D", "status": "running"}


@app.get(
    "/api/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Health check",
    description="Simple health endpoint for frontend readiness checks.",
)
def health() -> HealthResponse:
    return HealthResponse()
