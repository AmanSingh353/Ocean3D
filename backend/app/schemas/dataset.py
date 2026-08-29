from typing import Any, Literal

from pydantic import BaseModel, Field


class VariableMetadata(BaseModel):
    name: str
    standard_name: str | None = None
    units: str
    long_name: str | None = None
    fill_value: float | None = None


class DimensionMetadata(BaseModel):
    name: str
    size: int
    values: list[float | str] | None = Field(
        default=None,
        description="Coordinate values when small enough to include inline",
    )


class DatasetMetadata(BaseModel):
    dataset_id: str
    title: str
    source_type: Literal["demo", "netcdf", "incois"] = "demo"
    is_demo: bool = True
    description: str | None = None
    file_path: str | None = None
    dimensions: dict[str, int | list[Any]] = Field(
        description="Dimension names to size or coordinate arrays",
    )
    variables: list[VariableMetadata]
    depths: list[float]
    times: list[str]
    bounds: dict[str, float] = Field(
        description="lat_min, lat_max, lon_min, lon_max",
    )
    crs: str | None = "EPSG:4326"


class DatasetListResponse(BaseModel):
    datasets: list[DatasetMetadata]
