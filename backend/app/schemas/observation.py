from typing import Literal

from pydantic import BaseModel, Field


PlatformType = Literal["argo", "glider", "drifter", "satellite", "other"]
QualityFlag = Literal["GOOD", "FAIR", "POOR", "UNKNOWN", "MISSING"]


class ObservationRecord(BaseModel):
    platform_id: str
    platform_type: PlatformType
    latitude: float
    longitude: float
    timestamp: str = Field(description="ISO-8601 UTC timestamp")
    depth: float = Field(description="Depth in meters, positive down")
    variable: str
    value: float | None = None
    unit: str
    quality_flag: QualityFlag = "UNKNOWN"
    source_id: str
    is_demo: bool = True


class ObservationQuery(BaseModel):
    platform_type: PlatformType | None = None
    platform_id: str | None = None
    variable: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    min_depth: float | None = None
    max_depth: float | None = None
    north: float | None = None
    south: float | None = None
    east: float | None = None
    west: float | None = None


class ObservationListResponse(BaseModel):
    count: int
    observations: list[ObservationRecord]
    source_id: str
    is_demo: bool
