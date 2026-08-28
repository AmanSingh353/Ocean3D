from typing import Literal

from pydantic import BaseModel, Field


class InstrumentSummary(BaseModel):
    id: str
    type: Literal["argo", "glider"]
    latitude: float
    longitude: float
    max_depth: int
    status: Literal["ACTIVE", "INACTIVE"]
    last_updated: str = Field(description="ISO-8601 timestamp of the latest observation")


class InstrumentResponse(InstrumentSummary):
    data_quality: Literal["GOOD", "FAIR", "POOR"] = "GOOD"
    platform_type: str


class ProfileObservation(BaseModel):
    depth: int
    value: float


class ProfileComparisonPoint(BaseModel):
    depth: int
    observation: float
    model: float
    salinity_observation: float | None = None
    salinity_model: float | None = None
    chlorophyll_observation: float | None = None
    chlorophyll_model: float | None = None


class InstrumentProfileResponse(BaseModel):
    instrument_id: str
    variable: Literal["temperature"] = "temperature"
    unit: Literal["°C"] = "°C"
    date: str = Field(description="ISO-8601 date used for model comparison")
    observations: list[ProfileObservation]
    comparison: list[ProfileComparisonPoint]
