from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_chlorophyll import router as chlorophyll_router
from app.api.routes_current import router as current_router
from app.api.routes_instruments import router as instruments_router
from app.api.routes_model import router as model_router
from app.api.routes_salinity import router as salinity_router
from app.api.routes_scientific import router as scientific_router
from app.api.errors import register_exception_handlers
from app.schemas.model import HealthResponse

app = FastAPI(
    title="Ocean3D API",
    version="0.2.0",
    description=(
        "Ocean3D backend for Indian Ocean model fields, instrument observations, "
        "and scientific data services. Demo synthetic data remains available; "
        "NetCDF-backed datasets can be enabled via OCEAN3D_MODEL_DATA_MODE."
    ),
)

register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(model_router)
app.include_router(current_router)
app.include_router(salinity_router)
app.include_router(chlorophyll_router)
app.include_router(instruments_router)
app.include_router(scientific_router)


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
