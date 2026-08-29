from typing import Literal

from pydantic import BaseModel, Field


class DepthSelectionInfo(BaseModel):
    requested_depth: float
    available_lower_level: float | None = None
    available_upper_level: float | None = None
    nearest_level: float
    selection_method: Literal[
        "exact",
        "nearest",
        "between_levels",
        "below_range",
        "above_range",
    ]
    interpolated: bool = False


class ModelFieldRequest(BaseModel):
    variable: str
    time: str = Field(description="ISO-8601 or YYYY-MM-DD model time")
    depth: float
    north: float | None = None
    south: float | None = None
    east: float | None = None
    west: float | None = None
    dataset_id: str | None = None


class FieldGrid(BaseModel):
    latitudes: list[float]
    longitudes: list[float]


class FieldProvenance(BaseModel):
    dataset_id: str
    source_type: Literal["demo", "netcdf", "incois"]
    is_demo: bool
    variable: str
    netcdf_variable: str | None = None
    selection_method: str


class ModelFieldResponse(BaseModel):
    variable: str
    unit: str
    time: str
    depth: float = Field(description="Actual model depth level used for the slice")
    requested_depth: float
    depth_selection: DepthSelectionInfo
    bounds: dict[str, float]
    grid: FieldGrid
    values: list[list[float | None]]
    u: list[list[float | None]] | None = None
    v: list[list[float | None]] | None = None
    magnitude: list[list[float | None]] | None = None
    fill_value: float | None = None
    provenance: FieldProvenance


class ValidationPointResponse(BaseModel):
    variable: str
    unit: str
    platform_id: str
    compared_depth: float
    depth_selection: DepthSelectionInfo
    model: float | None = None
    observation: float | None = None
    difference: float | None = None
    bias: float | None = None
    absolute_error: float | None = None
    mean_bias: float | None = None
    mae: float | None = None
    rmse: float | None = None
    correlation: float | None = None
    matched_points: int = 0
    validation_status: Literal["GOOD", "MODERATE", "POOR"] | None = None
    is_demo: bool = True
    depth_sample_error: str | None = None
