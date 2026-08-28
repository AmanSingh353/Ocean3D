import math
from functools import lru_cache

from app.schemas.model import (
    Bounds,
    CurrentFieldResponse,
    Grid,
    ModelMetadataResponse,
    RegionInfo,
    TemperatureFieldResponse,
    VariableInfo,
)

LAT_MIN = 5
LAT_MAX = 20
LON_MIN = 65
LON_MAX = 85

DEPTHS = [0, 50, 100, 200, 500, 1000]
DATES = [
    "2026-08-20",
    "2026-08-21",
    "2026-08-22",
    "2026-08-23",
    "2026-08-24",
]

VARIABLES = [
    VariableInfo(name="temperature", unit="°C"),
    VariableInfo(name="current", unit="m/s"),
    VariableInfo(name="salinity", unit="PSU"),
    VariableInfo(name="chlorophyll", unit="mg/m³"),
]


def _date_index(date: str) -> int:
    return DATES.index(date)


def _compute_temperature(lat: float, lon: float, depth: float, date: str) -> float:
    """Deterministic smooth temperature field for the Indian Ocean MVP."""
    day_index = _date_index(date)

    # Surface baseline: warmer in the south, slight day-to-day drift
    surface = 29.4 - 0.14 * (lat - LAT_MIN) - 0.06 * day_index

    # Thermocline-driven cooling with depth
    thermocline = 1.0 / (1.0 + math.exp(-(depth - 120.0) / 38.0))
    deep = 8.6 + 0.015 * day_index
    base = surface - (surface - deep) * thermocline

    # Smooth spatial gradients
    lon_var = 0.75 * math.sin((lon - 72.0) * math.pi / 12.0)
    lat_var = 0.45 * math.cos((lat - 12.0) * math.pi / 8.0)

    # Mesoscale anomaly feature
    anomaly = (
        1.15
        * math.sin(lat * 0.65 + lon * 0.48)
        * math.cos(lon * 0.28 - lat * 0.19)
        * (1.0 - depth / 1000.0)
    )

    value = base + lon_var + lat_var + anomaly
    return round(max(8.0, min(31.0, value)), 2)


def _compute_current(
    lat: float, lon: float, depth: float, date: str,
) -> tuple[float, float, float]:
    """Deterministic synthetic surface current field for the Indian Ocean MVP."""
    day_index = _date_index(date)
    depth_factor = max(0.15, 1.0 - depth / 1200.0)

    u = (
        0.55 * math.sin((lon - 72.0) * math.pi / 12.0 + day_index * 0.12)
        + 0.35 * math.sin(lat * 0.65 + lon * 0.48)
    ) * depth_factor
    v = (
        0.45 * math.cos((lat - 12.0) * math.pi / 8.0 - depth * 0.002)
        + 0.28 * math.cos(lon * 0.28 - lat * 0.19)
    ) * depth_factor

    magnitude = math.sqrt(u * u + v * v)
    return round(u, 3), round(v, 3), round(magnitude, 3)


class OceanDataService:
    """Synthetic ocean model data. Replace with NetCDFOceanDataService later."""

    def __init__(self) -> None:
        self.latitudes = [float(v) for v in range(LAT_MIN, LAT_MAX + 1)]
        self.longitudes = [float(v) for v in range(LON_MIN, LON_MAX + 1)]
        self.depths = DEPTHS.copy()
        self.dates = DATES.copy()

    @staticmethod
    def validate_depth(depth: int) -> None:
        if depth not in DEPTHS:
            raise ValueError(
                f"Invalid depth {depth}. Allowed depths: {', '.join(map(str, DEPTHS))}"
            )

    @staticmethod
    def validate_depth_range(depth: int) -> None:
        if depth < 0 or depth > 1000:
            raise ValueError("Invalid depth. Allowed range: 0–1000 m")

    @staticmethod
    def validate_date(date: str) -> None:
        if date not in DATES:
            raise ValueError(
                f"Invalid date {date}. Allowed dates: {', '.join(DATES)}"
            )

    @lru_cache(maxsize=128)
    def _temperature_slice(self, date: str, depth: int) -> tuple[tuple[float, ...], ...]:
        rows: list[tuple[float, ...]] = []
        for lat in self.latitudes:
            row = tuple(
                _compute_temperature(lat, lon, float(depth), date)
                for lon in self.longitudes
            )
            rows.append(row)
        return tuple(rows)

    def get_temperature_at_point(
        self,
        latitude: float,
        longitude: float,
        depth: int,
        date: str,
    ) -> float:
        self.validate_depth(depth)
        self.validate_date(date)
        return _compute_temperature(latitude, longitude, float(depth), date)

    def get_temperature_field(
        self,
        date: str = "2026-08-24",
        depth: int = 100,
    ) -> TemperatureFieldResponse:
        self.validate_depth(depth)
        self.validate_date(date)

        cached = self._temperature_slice(date, depth)
        values = [list(row) for row in cached]

        return TemperatureFieldResponse(
            date=f"{date}T00:00:00Z",
            depth=depth,
            bounds=Bounds(
                lat_min=float(LAT_MIN),
                lat_max=float(LAT_MAX),
                lon_min=float(LON_MIN),
                lon_max=float(LON_MAX),
            ),
            grid=Grid(latitudes=self.latitudes, longitudes=self.longitudes),
            values=values,
        )

    @lru_cache(maxsize=128)
    def _current_slice(
        self, date: str, depth: int,
    ) -> tuple[tuple[tuple[float, float, float], ...], ...]:
        rows: list[tuple[tuple[float, float, float], ...]] = []
        for lat in self.latitudes:
            row = tuple(
                _compute_current(lat, lon, float(depth), date)
                for lon in self.longitudes
            )
            rows.append(tuple(row))
        return tuple(rows)

    def get_current_field(
        self,
        date: str = "2026-08-24",
        depth: int = 100,
    ) -> CurrentFieldResponse:
        self.validate_depth_range(depth)
        self.validate_date(date)

        cached = self._current_slice(date, depth)
        u_rows: list[list[float]] = []
        v_rows: list[list[float]] = []
        mag_rows: list[list[float]] = []

        for row in cached:
            u_row: list[float] = []
            v_row: list[float] = []
            mag_row: list[float] = []
            for u_val, v_val, mag in row:
                u_row.append(u_val)
                v_row.append(v_val)
                mag_row.append(mag)
            u_rows.append(u_row)
            v_rows.append(v_row)
            mag_rows.append(mag_row)

        return CurrentFieldResponse(
            date=f"{date}T00:00:00Z",
            depth=depth,
            bounds=Bounds(
                lat_min=float(LAT_MIN),
                lat_max=float(LAT_MAX),
                lon_min=float(LON_MIN),
                lon_max=float(LON_MAX),
            ),
            grid=Grid(latitudes=self.latitudes, longitudes=self.longitudes),
            u=u_rows,
            v=v_rows,
            magnitude=mag_rows,
        )

    def get_metadata(self) -> ModelMetadataResponse:
        return ModelMetadataResponse(
            variables=VARIABLES,
            depths=self.depths,
            dates=[f"{d}T00:00:00Z" for d in self.dates],
            region=RegionInfo(
                lat_min=float(LAT_MIN),
                lat_max=float(LAT_MAX),
                lon_min=float(LON_MIN),
                lon_max=float(LON_MAX),
            ),
        )


ocean_data_service = OceanDataService()
