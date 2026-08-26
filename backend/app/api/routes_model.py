from fastapi import APIRouter, HTTPException, Query

from app.schemas.model import ModelMetadataResponse, TemperatureFieldResponse
from app.services.ocean_data import ocean_data_service

router = APIRouter(prefix="/api/model", tags=["Model Data"])


@router.get(
    "/metadata",
    response_model=ModelMetadataResponse,
    summary="Get available model metadata",
    description="Return supported variables, depth levels, dates, and the Indian Ocean region bounds.",
)
def get_model_metadata() -> ModelMetadataResponse:
    return ocean_data_service.get_metadata()


@router.get(
    "/temperature",
    response_model=TemperatureFieldResponse,
    summary="Get synthetic temperature field",
    description=(
        "Return a deterministic temperature slice for the Indian Ocean at the requested "
        "depth and date. Defaults to 100 m on 2026-08-24."
    ),
)
def get_temperature_field(
    depth: int = Query(
        100,
        description="Depth level in meters",
        examples=[100],
    ),
    date: str = Query(
        "2026-08-24",
        description="Model date in YYYY-MM-DD format",
        examples=["2026-08-24"],
    ),
) -> TemperatureFieldResponse:
    try:
        return ocean_data_service.get_temperature_field(date=date, depth=depth)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
