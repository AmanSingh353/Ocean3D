from fastapi import APIRouter, HTTPException, Query

from app.schemas.instruments import (
    InstrumentProfileResponse,
    InstrumentResponse,
    InstrumentSummary,
)
from app.services.instrument_data import instrument_data_service
from app.services.ocean_data import ocean_data_service

router = APIRouter(prefix="/api/instruments", tags=["Instruments"])


@router.get(
    "",
    response_model=list[InstrumentSummary],
    summary="List all instruments",
    description="Return synthetic Argo floats and underwater gliders in the Indian Ocean region.",
)
def list_instruments(
    date: str = Query(
        "2026-08-24",
        description="Date used for last_updated timestamps (YYYY-MM-DD)",
    ),
) -> list[InstrumentSummary]:
    try:
        ocean_data_service.validate_date(date)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return instrument_data_service.list_instruments(date=date)


@router.get(
    "/{instrument_id}",
    response_model=InstrumentResponse,
    summary="Get instrument metadata",
    description="Return metadata for a single Argo float or glider.",
)
def get_instrument(
    instrument_id: str,
    date: str = Query(
        "2026-08-24",
        description="Date used for last_updated timestamp (YYYY-MM-DD)",
    ),
) -> InstrumentResponse:
    try:
        ocean_data_service.validate_date(date)
        return instrument_data_service.get_instrument(instrument_id, date=date)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Instrument '{instrument_id}' not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get(
    "/{instrument_id}/profile",
    response_model=InstrumentProfileResponse,
    summary="Get instrument temperature profile",
    description=(
        "Return a synthetic observed temperature profile with corresponding model values "
        "for comparison at the instrument location."
    ),
)
def get_instrument_profile(
    instrument_id: str,
    date: str = Query(
        "2026-08-24",
        description="Model comparison date in YYYY-MM-DD format",
    ),
) -> InstrumentProfileResponse:
    try:
        return instrument_data_service.get_profile(instrument_id, date=date)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Instrument '{instrument_id}' not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
