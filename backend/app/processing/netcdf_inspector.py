"""Inspect NetCDF datasets without loading full arrays into memory."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import xarray as xr

# Common CF / oceanographic name aliases
LAT_NAMES = ("lat", "latitude", "LAT", "y")
LON_NAMES = ("lon", "longitude", "LON", "x")
DEPTH_NAMES = ("depth", "deptht", "lev", "level", "z", "depthu")
TIME_NAMES = ("time", "TIME", "t")
TEMP_NAMES = ("temperature", "temp", "thetao", "TEMP", "water_temp")
SAL_NAMES = ("salinity", "sal", "so", "PSAL", "psu")
U_NAMES = ("u", "uo", "eastward_velocity", "U")
V_NAMES = ("v", "vo", "northward_velocity", "V")
CHL_NAMES = ("chlorophyll", "chl", "CHL", "chlor_a")


@dataclass(frozen=True)
class NetCDFMapping:
    lat: str
    lon: str
    depth: str
    time: str
    variables: dict[str, str]  # ocean3d name → netcdf name


def _find_coord(ds: xr.Dataset, names: tuple[str, ...]) -> str | None:
    for name in names:
        if name in ds.coords:
            return name
        if name in ds.dims:
            return name
        if name in ds.data_vars and ds[name].ndim >= 1:
            return name
    # case-insensitive fallback
    lower_map = {k.lower(): k for k in list(ds.coords) + list(ds.dims) + list(ds.data_vars)}
    for name in names:
        hit = lower_map.get(name.lower())
        if hit:
            return hit
    return None


def _find_var(ds: xr.Dataset, names: tuple[str, ...]) -> str | None:
    for name in names:
        if name in ds.data_vars:
            return name
    lower_map = {k.lower(): k for k in ds.data_vars}
    for name in names:
        hit = lower_map.get(name.lower())
        if hit:
            return hit
    return None


def detect_mapping(ds: xr.Dataset) -> NetCDFMapping:
    lat = _find_coord(ds, LAT_NAMES)
    lon = _find_coord(ds, LON_NAMES)
    depth = _find_coord(ds, DEPTH_NAMES)
    time = _find_coord(ds, TIME_NAMES)
    if not lat or not lon:
        raise ValueError("NetCDF file missing latitude/longitude coordinates")

    variables: dict[str, str] = {}
    for ocean_name, candidates in (
        ("temperature", TEMP_NAMES),
        ("salinity", SAL_NAMES),
        ("u", U_NAMES),
        ("v", V_NAMES),
        ("chlorophyll", CHL_NAMES),
    ):
        var = _find_var(ds, candidates)
        if var:
            variables[ocean_name] = var

    if not depth:
        depth = "surface"
    if not time:
        time = "time"

    return NetCDFMapping(
        lat=lat,
        lon=lon,
        depth=depth,
        time=time,
        variables=variables,
    )


def _coord_values(ds: xr.Dataset, name: str) -> list[Any]:
    if name not in ds.coords and name not in ds.dims:
        return []
    coord = ds[name]
    if coord.size > 512:
        return []
    try:
        if np.issubdtype(coord.dtype, np.datetime64):
            return [str(v) for v in coord.values]
        return [float(v) for v in coord.values]
    except (TypeError, ValueError):
        return [str(v) for v in coord.values]


def inspect_netcdf(path: Path) -> dict[str, Any]:
    """Return metadata dict for a NetCDF file (opens lazily)."""
    with xr.open_dataset(path, decode_times=True) as ds:
        mapping = detect_mapping(ds)
        depths: list[float] = []
        if mapping.depth in ds.coords:
            depths = [float(v) for v in ds[mapping.depth].values]
        elif mapping.depth == "surface":
            depths = [0.0]

        times: list[str] = []
        if mapping.time in ds.coords:
            for v in ds[mapping.time].values:
                times.append(np.datetime_as_string(v, unit="s") + "Z")

        lat_vals = ds[mapping.lat].values
        lon_vals = ds[mapping.lon].values

        variables = []
        unit_map = {
            "temperature": "°C",
            "salinity": "PSU",
            "u": "m/s",
            "v": "m/s",
            "chlorophyll": "mg/m³",
        }
        for ocean_name, nc_name in mapping.variables.items():
            var = ds[nc_name]
            units = var.attrs.get("units", unit_map.get(ocean_name, ""))
            fill = var.attrs.get("_FillValue") or var.attrs.get("missing_value")
            variables.append(
                {
                    "name": ocean_name,
                    "standard_name": nc_name,
                    "units": str(units),
                    "long_name": str(var.attrs.get("long_name", ocean_name)),
                    "fill_value": float(fill) if fill is not None else None,
                }
            )

        return {
            "mapping": mapping,
            "dimensions": {d: int(ds.sizes[d]) for d in ds.sizes},
            "variables": variables,
            "depths": depths,
            "times": times,
            "bounds": {
                "lat_min": float(np.min(lat_vals)),
                "lat_max": float(np.max(lat_vals)),
                "lon_min": float(np.min(lon_vals)),
                "lon_max": float(np.max(lon_vals)),
            },
        }
