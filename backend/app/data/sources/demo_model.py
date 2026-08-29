"""Demo synthetic model source — wraps existing OceanDataService."""

from __future__ import annotations

from app.data.sources.base import OceanModelDataSource
from app.processing.depth_resolver import resolve_depth_levels
from app.schemas.dataset import DatasetMetadata, VariableMetadata
from app.schemas.scientific import (
    DepthSelectionInfo,
    FieldGrid,
    FieldProvenance,
    ModelFieldRequest,
    ModelFieldResponse,
)
from app.services.ocean_data import (
    DEPTHS,
    DATES,
    LAT_MAX,
    LAT_MIN,
    LON_MAX,
    LON_MIN,
    OceanDataService,
    ocean_data_service,
)

UNIT_MAP = {
    "temperature": "°C",
    "salinity": "PSU",
    "current": "m/s",
    "chlorophyll": "mg/m³",
}


class DemoModelDataSource(OceanModelDataSource):
    def __init__(self, service: OceanDataService | None = None) -> None:
        self._service = service or ocean_data_service

    @property
    def dataset_id(self) -> str:
        return "ocean3d-demo-synthetic"

    @property
    def is_demo(self) -> bool:
        return True

    def get_metadata(self) -> DatasetMetadata:
        meta = self._service.get_metadata()
        return DatasetMetadata(
            dataset_id=self.dataset_id,
            title="Ocean3D Demo Synthetic Model",
            source_type="demo",
            is_demo=True,
            description=(
                "Deterministic synthetic Indian Ocean model for MVP visualization. "
                "Not real INCOIS operational data."
            ),
            dimensions={
                "time": len(meta.dates),
                "depth": len(meta.depths),
                "latitude": len(self._service.latitudes),
                "longitude": len(self._service.longitudes),
            },
            variables=[
                VariableMetadata(name=v.name, units=v.unit, long_name=f"Demo {v.name}")
                for v in meta.variables
            ],
            depths=[float(d) for d in meta.depths],
            times=meta.dates,
            bounds={
                "lat_min": float(LAT_MIN),
                "lat_max": float(LAT_MAX),
                "lon_min": float(LON_MIN),
                "lon_max": float(LON_MAX),
            },
        )

    def resolve_depth(self, requested_depth: float) -> DepthSelectionInfo:
        return resolve_depth_levels(requested_depth, [float(d) for d in DEPTHS])

    def _date_from_time(self, time_str: str) -> str:
        return time_str[:10]

    def _subset_grid(
        self,
        lats: list[float],
        lons: list[float],
        values: list[list[float]],
        south: float | None,
        north: float | None,
        west: float | None,
        east: float | None,
    ) -> tuple[list[float], list[float], list[list[float]]]:
        lat_lo = south if south is not None else LAT_MIN
        lat_hi = north if north is not None else LAT_MAX
        lon_lo = west if west is not None else LON_MIN
        lon_hi = east if east is not None else LON_MAX

        lat_idx = [i for i, la in enumerate(lats) if lat_lo <= la <= lat_hi]
        lon_idx = [i for i, lo in enumerate(lons) if lon_lo <= lo <= lon_hi]
        if not lat_idx or not lon_idx:
            raise ValueError("Geographic bounds exclude all model grid points")

        sub_lats = [lats[i] for i in lat_idx]
        sub_lons = [lons[i] for i in lon_idx]
        sub_vals = [[values[i][j] for j in lon_idx] for i in lat_idx]
        return sub_lats, sub_lons, sub_vals

    def get_field(self, request: ModelFieldRequest) -> ModelFieldResponse:
        depth_info = self.resolve_depth(request.depth)
        use_depth = int(depth_info.nearest_level)
        date = self._date_from_time(request.time)

        if date not in DATES:
            raise ValueError(f"Time '{request.time}' unavailable. Available: {', '.join(DATES)}")

        variable = request.variable
        if variable == "temperature":
            field = self._service.get_temperature_field(date=date, depth=use_depth)
            raw_values = field.values
        elif variable == "salinity":
            field = self._service.get_salinity_field(date=date, depth=use_depth)
            raw_values = field.values
        elif variable == "chlorophyll":
            field = self._service.get_chlorophyll_field(date=date, depth=use_depth)
            raw_values = field.values
        elif variable == "current":
            field = self._service.get_current_field(date=date, depth=use_depth)
            lats, lons, u = self._subset_grid(
                field.grid.latitudes,
                field.grid.longitudes,
                field.u,
                request.south,
                request.north,
                request.west,
                request.east,
            )
            _, _, v = self._subset_grid(
                field.grid.latitudes,
                field.grid.longitudes,
                field.v,
                request.south,
                request.north,
                request.west,
                request.east,
            )
            _, _, mag = self._subset_grid(
                field.grid.latitudes,
                field.grid.longitudes,
                field.magnitude,
                request.south,
                request.north,
                request.west,
                request.east,
            )
            return ModelFieldResponse(
                variable="current",
                unit="m/s",
                time=field.date,
                depth=float(use_depth),
                requested_depth=request.depth,
                depth_selection=depth_info,
                bounds={
                    "lat_min": min(lats),
                    "lat_max": max(lats),
                    "lon_min": min(lons),
                    "lon_max": max(lons),
                },
                grid=FieldGrid(latitudes=lats, longitudes=lons),
                values=mag,
                u=u,
                v=v,
                magnitude=mag,
                provenance=FieldProvenance(
                    dataset_id=self.dataset_id,
                    source_type="demo",
                    is_demo=True,
                    variable="current",
                    selection_method=depth_info.selection_method,
                ),
            )
        else:
            raise ValueError(f"Variable '{variable}' unavailable in demo dataset")

        lats, lons, values = self._subset_grid(
            field.grid.latitudes,
            field.grid.longitudes,
            raw_values,
            request.south,
            request.north,
            request.west,
            request.east,
        )

        return ModelFieldResponse(
            variable=variable,
            unit=UNIT_MAP[variable],
            time=field.date,
            depth=float(use_depth),
            requested_depth=request.depth,
            depth_selection=depth_info,
            bounds={
                "lat_min": min(lats),
                "lat_max": max(lats),
                "lon_min": min(lons),
                "lon_max": max(lons),
            },
            grid=FieldGrid(latitudes=lats, longitudes=lons),
            values=values,
            provenance=FieldProvenance(
                dataset_id=self.dataset_id,
                source_type="demo",
                is_demo=True,
                variable=variable,
                selection_method=depth_info.selection_method,
            ),
        )
