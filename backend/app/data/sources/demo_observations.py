"""Demo observation source — materializes synthetic platform profiles."""

from __future__ import annotations

from typing import Any

from app.data.sources.base import ObservationDataSource
from app.processing.quality import is_valid_coordinate, is_valid_depth
from app.schemas.observation import ObservationQuery, ObservationRecord
from app.services.instrument_data import INSTRUMENTS, instrument_data_service


class DemoObservationDataSource(ObservationDataSource):
    @property
    def source_id(self) -> str:
        return "ocean3d-demo-observations"

    @property
    def is_demo(self) -> bool:
        return True

    def get_metadata(self) -> dict[str, Any]:
        return {
            "source_id": self.source_id,
            "is_demo": True,
            "platform_count": len(INSTRUMENTS),
            "platform_types": sorted({r.type for r in INSTRUMENTS.values()}),
            "variables": ["temperature", "salinity", "current", "chlorophyll"],
        }

    def query(self, filters: ObservationQuery) -> list[ObservationRecord]:
        records: list[ObservationRecord] = []
        date = filters.start_time[:10] if filters.start_time else "2026-08-24"

        for inst_id, inst in INSTRUMENTS.items():
            if filters.platform_id and inst_id != filters.platform_id:
                continue
            if filters.platform_type and inst.type != filters.platform_type:
                continue
            if not is_valid_coordinate(inst.latitude, inst.longitude):
                continue
            if filters.north is not None and inst.latitude > filters.north:
                continue
            if filters.south is not None and inst.latitude < filters.south:
                continue
            if filters.west is not None and inst.longitude < filters.west:
                continue
            if filters.east is not None and inst.longitude > filters.east:
                continue

            try:
                profile = instrument_data_service.get_profile(inst_id, date=date)
            except (KeyError, ValueError):
                continue

            for obs, comp in zip(profile.observations, profile.comparison):
                depth = float(obs.depth)
                if filters.min_depth is not None and depth < filters.min_depth:
                    continue
                if filters.max_depth is not None and depth > filters.max_depth:
                    continue
                if not is_valid_depth(depth, float(inst.max_depth)):
                    continue

                for variable, obs_val, model_val, unit in (
                    ("temperature", obs.value, comp.model, "°C"),
                    ("salinity", comp.salinity_observation, comp.salinity_model, "PSU"),
                    ("chlorophyll", comp.chlorophyll_observation, comp.chlorophyll_model, "mg/m³"),
                    ("current", comp.current_observation, comp.current_model, "m/s"),
                ):
                    if filters.variable and filters.variable != variable:
                        continue
                    if obs_val is None:
                        continue
                    records.append(
                        ObservationRecord(
                            platform_id=inst_id,
                            platform_type=inst.type,  # type: ignore[arg-type]
                            latitude=inst.latitude,
                            longitude=inst.longitude,
                            timestamp=profile.date,
                            depth=depth,
                            variable=variable,
                            value=float(obs_val),
                            unit=unit,
                            quality_flag="GOOD",
                            source_id=self.source_id,
                            is_demo=True,
                        )
                    )
        return records
