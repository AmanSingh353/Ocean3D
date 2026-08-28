from fastapi import APIRouter, HTTPException, Query

from app.schemas.model import ChlorophyllFieldResponse
from app.services.ocean_data import ocean_data_service

router = APIRouter(prefix="/api", tags=["Chlorophyll Data"])


@router.get(
    "/chlorophyll",
    response_model=ChlorophyllFieldResponse,
    summary="Get synthetic ocean chlorophyll field",
    description=(
        "Return a deterministic chlorophyll-a concentration slice for the Indian Ocean "
        "at the requested depth and date. Values are in mg/m³."
    ),
)
def get_chlorophyll_field(
    depth: int = Query(
        100,
        ge=0,
        le=1000,
        description="Depth level in meters (0–1000)",
        examples=[100],
    ),
    date: str = Query(
        "2026-08-24",
        description="Model date in YYYY-MM-DD format",
        examples=["2026-08-24"],
    ),
) -> ChlorophyllFieldResponse:
    try:
        return ocean_data_service.get_chlorophyll_field(date=date, depth=depth)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
