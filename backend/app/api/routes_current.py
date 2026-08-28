from fastapi import APIRouter, HTTPException, Query

from app.schemas.model import CurrentFieldResponse
from app.services.ocean_data import ocean_data_service

router = APIRouter(prefix="/api", tags=["Current Data"])


@router.get(
    "/current",
    response_model=CurrentFieldResponse,
    summary="Get synthetic ocean current field",
    description=(
        "Return a deterministic current velocity slice for the Indian Ocean at the "
        "requested depth and date. Includes u (east), v (north), and magnitude."
    ),
)
def get_current_field(
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
) -> CurrentFieldResponse:
    try:
        return ocean_data_service.get_current_field(date=date, depth=depth)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
