from fastapi import APIRouter, HTTPException, Query

from app.schemas.model import SalinityFieldResponse
from app.services.ocean_data import ocean_data_service

router = APIRouter(prefix="/api", tags=["Salinity Data"])


@router.get(
    "/salinity",
    response_model=SalinityFieldResponse,
    summary="Get synthetic ocean salinity field",
    description=(
        "Return a deterministic salinity slice for the Indian Ocean at the requested "
        "depth and date. Values are in practical salinity units (PSU)."
    ),
)
def get_salinity_field(
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
) -> SalinityFieldResponse:
    try:
        return ocean_data_service.get_salinity_field(date=date, depth=depth)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
