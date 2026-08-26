import math
from dataclasses import dataclass

from app.schemas.instruments import (
    InstrumentProfileResponse,
    InstrumentResponse,
    InstrumentSummary,
    ProfileComparisonPoint,
    ProfileObservation,
)
from app.services.ocean_data import ocean_data_service

PROFILE_DEPTHS = [0, 50, 100, 200, 500, 1000]


@dataclass(frozen=True)
class InstrumentRecord:
    id: str
    type: str
    latitude: float
    longitude: float
    max_depth: int
    status: str
    platform_type: str
    observation_offset: float


INSTRUMENTS: dict[str, InstrumentRecord] = {
    "ARGO-001": InstrumentRecord(
        id="ARGO-001",
        type="argo",
        latitude=12.4,
        longitude=72.6,
        max_depth=1000,
        status="ACTIVE",
        platform_type="Profiling Float",
        observation_offset=0.3,
    ),
    "ARGO-014": InstrumentRecord(
        id="ARGO-014",
        type="argo",
        latitude=15.8,
        longitude=76.1,
        max_depth=1000,
        status="ACTIVE",
        platform_type="Profiling Float",
        observation_offset=-0.2,
    ),
    "ARGO-021": InstrumentRecord(
        id="ARGO-021",
        type="argo",
        latitude=9.8,
        longitude=70.4,
        max_depth=1000,
        status="ACTIVE",
        platform_type="Profiling Float",
        observation_offset=0.5,
    ),
    "GLIDER-007": InstrumentRecord(
        id="GLIDER-007",
        type="glider",
        latitude=10.9,
        longitude=79.2,
        max_depth=500,
        status="ACTIVE",
        platform_type="Underwater Glider",
        observation_offset=-0.4,
    ),
}


def _last_updated(instrument_id: str, date: str) -> str:
    hour = 6 + (ord(instrument_id[-1]) % 12)
    return f"{date}T{hour:02d}:30:00Z"


def _observation_value(
    model_value: float,
    depth: int,
    offset: float,
    instrument_id: str,
) -> float:
    ripple = math.sin(depth * 0.02 + ord(instrument_id[-1])) * 0.12
    return round(model_value + offset + ripple, 1)


class InstrumentDataService:
    """Synthetic instrument observations aligned with the model service."""

    def list_instruments(self, date: str = "2026-08-24") -> list[InstrumentSummary]:
        return [
            InstrumentSummary(
                id=record.id,
                type=record.type,  # type: ignore[arg-type]
                latitude=record.latitude,
                longitude=record.longitude,
                max_depth=record.max_depth,
                status=record.status,  # type: ignore[arg-type]
                last_updated=_last_updated(record.id, date),
            )
            for record in INSTRUMENTS.values()
        ]

    def get_instrument(self, instrument_id: str, date: str = "2026-08-24") -> InstrumentResponse:
        record = INSTRUMENTS.get(instrument_id)
        if record is None:
            raise KeyError(instrument_id)

        return InstrumentResponse(
            id=record.id,
            type=record.type,  # type: ignore[arg-type]
            latitude=record.latitude,
            longitude=record.longitude,
            max_depth=record.max_depth,
            status=record.status,  # type: ignore[arg-type]
            last_updated=_last_updated(record.id, date),
            platform_type=record.platform_type,
        )

    def get_profile(
        self,
        instrument_id: str,
        date: str = "2026-08-24",
    ) -> InstrumentProfileResponse:
        record = INSTRUMENTS.get(instrument_id)
        if record is None:
            raise KeyError(instrument_id)

        ocean_data_service.validate_date(date)

        depths = [d for d in PROFILE_DEPTHS if d <= record.max_depth]
        observations: list[ProfileObservation] = []
        comparison: list[ProfileComparisonPoint] = []

        for depth in depths:
            model_value = ocean_data_service.get_temperature_at_point(
                record.latitude,
                record.longitude,
                depth,
                date,
            )
            observation_value = _observation_value(
                model_value,
                depth,
                record.observation_offset,
                record.id,
            )
            observations.append(ProfileObservation(depth=depth, value=observation_value))
            comparison.append(
                ProfileComparisonPoint(
                    depth=depth,
                    observation=observation_value,
                    model=round(model_value, 1),
                )
            )

        return InstrumentProfileResponse(
            instrument_id=record.id,
            date=f"{date}T00:00:00Z",
            observations=observations,
            comparison=comparison,
        )


instrument_data_service = InstrumentDataService()
