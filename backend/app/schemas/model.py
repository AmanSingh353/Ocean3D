from typing import Literal

from pydantic import BaseModel, Field


class Bounds(BaseModel):
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


class Grid(BaseModel):
    latitudes: list[float] = Field(description="Latitude coordinates in degrees north")
    longitudes: list[float] = Field(description="Longitude coordinates in degrees east")


class TemperatureFieldResponse(BaseModel):
    variable: Literal["temperature"] = "temperature"
    unit: Literal["°C"] = "°C"
    date: str = Field(description="ISO-8601 timestamp for the model field")
    depth: int = Field(description="Depth level in meters")
    bounds: Bounds
    grid: Grid
    values: list[list[float]] = Field(
        description="Temperature values [lat_index][lon_index] aligned with grid axes"
    )


class VariableInfo(BaseModel):
    name: str
    unit: str


class RegionInfo(BaseModel):
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float


class ModelMetadataResponse(BaseModel):
    variables: list[VariableInfo]
    depths: list[int]
    dates: list[str]
    region: RegionInfo


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
