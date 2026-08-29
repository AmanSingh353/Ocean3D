"""Scientific data API routes — parallel to legacy demo endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.data.registry import data_registry
from app.schemas.dataset import DatasetListResponse, DatasetMetadata
from app.schemas.observation import ObservationListResponse, ObservationQuery
from app.schemas.scientific import ModelFieldRequest, ModelFieldResponse, ValidationPointResponse
from app.validation.service import validation_service

router = APIRouter(prefix="/api", tags=["Scientific Data"])


@router.get(
    "/datasets",
    response_model=DatasetListResponse,
    summary="List available ocean datasets",
)
def list_datasets() -> DatasetListResponse:
    datasets = [src.get_metadata() for src in data_registry.list_model_sources()]
    return DatasetListResponse(datasets=datasets)


@router.get(
    "/datasets/{dataset_id}",
    response_model=DatasetMetadata,
    summary="Get dataset metadata",
)
def get_dataset(dataset_id: str) -> DatasetMetadata:
    try:
        return data_registry.get_model_source(dataset_id).get_metadata()
    except Exception as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get(
    "/model/field",
    response_model=ModelFieldResponse,
    summary="Get model field subset (scientific API)",
    description=(
        "Returns a geographic subset of a model variable at the nearest available depth level. "
        "Does not interpolate vertically unless interpolation is explicitly enabled in a future version. "
        "Legacy routes (/api/model/temperature, etc.) remain unchanged."
    ),
)
def get_model_field(
    variable: str = Query(..., description="temperature | salinity | current | chlorophyll"),
    time: str = Query(..., description="Model time ISO-8601 or YYYY-MM-DD"),
    depth: float = Query(..., description="Requested depth in meters"),
    north: float | None = Query(None),
    south: float | None = Query(None),
    east: float | None = Query(None),
    west: float | None = Query(None),
    dataset_id: str | None = Query(None),
) -> ModelFieldResponse:
    request = ModelFieldRequest(
        variable=variable,
        time=time,
        depth=depth,
        north=north,
        south=south,
        east=east,
        west=west,
        dataset_id=dataset_id,
    )
    try:
        source = data_registry.get_model_source(dataset_id)
        return source.get_field(request)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get(
    "/observations",
    response_model=ObservationListResponse,
    summary="Query standardized observation records",
)
def query_observations(
    platform_type: str | None = Query(None),
    platform_id: str | None = Query(None),
    variable: str | None = Query(None),
    start_time: str | None = Query(None),
    end_time: str | None = Query(None),
    min_depth: float | None = Query(None),
    max_depth: float | None = Query(None),
    north: float | None = Query(None),
    south: float | None = Query(None),
    east: float | None = Query(None),
    west: float | None = Query(None),
) -> ObservationListResponse:
    filters = ObservationQuery(
        platform_type=platform_type,  # type: ignore[arg-type]
        platform_id=platform_id,
        variable=variable,
        start_time=start_time,
        end_time=end_time,
        min_depth=min_depth,
        max_depth=max_depth,
        north=north,
        south=south,
        east=east,
        west=west,
    )
    source = data_registry.get_observation_source()
    obs = source.query(filters)
    return ObservationListResponse(
        count=len(obs),
        observations=obs,
        source_id=source.source_id,
        is_demo=source.is_demo,
    )


@router.get(
    "/validation/platform/{platform_id}",
    response_model=ValidationPointResponse,
    summary="Platform validation metrics (server-side)",
)
def validate_platform(
    platform_id: str,
    variable: str = Query("temperature"),
    depth: float = Query(100),
    time: str = Query("2026-08-24"),
) -> ValidationPointResponse:
    try:
        return validation_service.validate_platform(platform_id, variable, depth, time)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=f"Platform '{platform_id}' not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
