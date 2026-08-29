"""NetCDF-backed ocean model data source — lazy subset reads via xarray."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import xarray as xr

from app.data.sources.base import OceanModelDataSource
from app.processing.depth_resolver import resolve_depth_levels
from app.processing.netcdf_inspector import detect_mapping, inspect_netcdf
from app.processing.quality import sanitize_array, sanitize_scalar
from app.schemas.dataset import DatasetMetadata, VariableMetadata
from app.schemas.scientific import (
    DepthSelectionInfo,
    FieldGrid,
    FieldProvenance,
    ModelFieldRequest,
    ModelFieldResponse,
)

UNIT_MAP = {
    "temperature": "°C",
    "salinity": "PSU",
    "u": "m/s",
    "v": "m/s",
    "chlorophyll": "mg/m³",
    "current": "m/s",
}


class NetCDFModelDataSource(OceanModelDataSource):
    def __init__(self, path: Path, dataset_id: str) -> None:
        self._path = path
        self._dataset_id = dataset_id
        self._meta = inspect_netcdf(path)
        self._mapping = self._meta["mapping"]

    @property
    def dataset_id(self) -> str:
        return self._dataset_id

    @property
    def is_demo(self) -> bool:
        return False

    def get_metadata(self) -> DatasetMetadata:
        return DatasetMetadata(
            dataset_id=self._dataset_id,
            title=f"NetCDF model — {self._path.name}",
            source_type="netcdf",
            is_demo=False,
            description="Scientific ocean model dataset loaded from NetCDF",
            file_path=str(self._path),
            dimensions=self._meta["dimensions"],
            variables=[VariableMetadata(**v) for v in self._meta["variables"]],
            depths=self._meta["depths"],
            times=self._meta["times"],
            bounds=self._meta["bounds"],
        )

    def resolve_depth(self, requested_depth: float) -> DepthSelectionInfo:
        return resolve_depth_levels(requested_depth, self._meta["depths"])

    def _select_time(self, ds: xr.Dataset, time_str: str) -> xr.Dataset:
        if self._mapping.time not in ds.coords:
            return ds
        target = np.datetime64(time_str.replace("Z", ""))
        times = ds[self._mapping.time].values
        idx = int(np.argmin(np.abs(times.astype("datetime64[s]") - target.astype("datetime64[s]"))))
        return ds.isel({self._mapping.time: idx})

    def _select_depth(self, ds: xr.Dataset, depth_level: float) -> xr.Dataset:
        if self._mapping.depth not in ds.coords:
            return ds
        depths = ds[self._mapping.depth].values.astype(float)
        idx = int(np.argmin(np.abs(depths - depth_level)))
        return ds.isel({self._mapping.depth: idx})

    def _subset_bbox(
        self,
        ds: xr.Dataset,
        south: float | None,
        north: float | None,
        west: float | None,
        east: float | None,
    ) -> xr.Dataset:
        lat_name, lon_name = self._mapping.lat, self._mapping.lon
        lat = ds[lat_name]
        if south is not None and north is not None:
            if float(lat[0]) < float(lat[-1]):
                ds = ds.sel({lat_name: slice(south, north)})
            else:
                ds = ds.sel({lat_name: slice(north, south)})
        if west is not None and east is not None:
            lon = ds[lon_name]
            if float(lon[0]) < float(lon[-1]):
                ds = ds.sel({lon_name: slice(west, east)})
            else:
                ds = ds.sel({lon_name: slice(east, west)})
        return ds

    def get_field(self, request: ModelFieldRequest) -> ModelFieldResponse:
        depth_info = self.resolve_depth(request.depth)
        use_depth = depth_info.nearest_level

        var_key = request.variable
        if var_key == "current":
            return self._get_current_field(request, depth_info, use_depth)

        if var_key not in self._mapping.variables:
            raise ValueError(f"Variable '{request.variable}' unavailable in NetCDF dataset")

        nc_var = self._mapping.variables[var_key]

        with xr.open_dataset(self._path, decode_times=True) as ds:
            ds = self._select_time(ds, request.time)
            ds = self._select_depth(ds, use_depth)
            ds = self._subset_bbox(ds, request.south, request.north, request.west, request.east)

            da = ds[nc_var]
            if self._mapping.depth in da.dims:
                da = da.isel({self._mapping.depth: 0})
            if self._mapping.time in da.dims:
                da = da.isel({self._mapping.time: 0})

            lats = [float(v) for v in ds[self._mapping.lat].values]
            lons = [float(v) for v in ds[self._mapping.lon].values]
            arr = da.values
            if arr.ndim != 2:
                raise ValueError(f"Expected 2D slice for {nc_var}, got shape {arr.shape}")

            fill = da.attrs.get("_FillValue") or da.attrs.get("missing_value")
            fill_f = float(fill) if fill is not None else None
            values = sanitize_array(np.asarray(arr), fill_f)

            time_val = request.time
            if self._mapping.time in ds.coords:
                time_val = str(ds[self._mapping.time].values.item())

            bounds = {
                "lat_min": min(lats),
                "lat_max": max(lats),
                "lon_min": min(lons),
                "lon_max": max(lons),
            }

            return ModelFieldResponse(
                variable=var_key,
                unit=str(da.attrs.get("units", UNIT_MAP.get(var_key, ""))),
                time=time_val if time_val.endswith("Z") else f"{time_val}Z",
                depth=use_depth,
                requested_depth=request.depth,
                depth_selection=depth_info,
                bounds=bounds,
                grid=FieldGrid(latitudes=lats, longitudes=lons),
                values=values,
                fill_value=fill_f,
                provenance=FieldProvenance(
                    dataset_id=self._dataset_id,
                    source_type="netcdf",
                    is_demo=False,
                    variable=var_key,
                    netcdf_variable=nc_var,
                    selection_method=depth_info.selection_method,
                ),
            )

    def _get_current_field(
        self,
        request: ModelFieldRequest,
        depth_info: DepthSelectionInfo,
        use_depth: float,
    ) -> ModelFieldResponse:
        if "u" not in self._mapping.variables or "v" not in self._mapping.variables:
            raise ValueError("Current components u/v unavailable in NetCDF dataset")

        with xr.open_dataset(self._path, decode_times=True) as ds:
            ds = self._select_time(ds, request.time)
            ds = self._select_depth(ds, use_depth)
            ds = self._subset_bbox(ds, request.south, request.north, request.west, request.east)

            u_da = ds[self._mapping.variables["u"]]
            v_da = ds[self._mapping.variables["v"]]
            for dim in (self._mapping.depth, self._mapping.time):
                if dim in u_da.dims:
                    u_da = u_da.isel({dim: 0})
                    v_da = v_da.isel({dim: 0})

            lats = [float(v) for v in ds[self._mapping.lat].values]
            lons = [float(v) for v in ds[self._mapping.lon].values]
            u_arr = np.asarray(u_da.values, dtype=float)
            v_arr = np.asarray(v_da.values, dtype=float)
            mag = np.sqrt(u_arr ** 2 + v_arr ** 2)

            fill = u_da.attrs.get("_FillValue")
            fill_f = float(fill) if fill is not None else None

            time_val = request.time
            if self._mapping.time in ds.coords:
                time_val = str(ds[self._mapping.time].values.item())

            return ModelFieldResponse(
                variable="current",
                unit="m/s",
                time=time_val if time_val.endswith("Z") else f"{time_val}Z",
                depth=use_depth,
                requested_depth=request.depth,
                depth_selection=depth_info,
                bounds={
                    "lat_min": min(lats),
                    "lat_max": max(lats),
                    "lon_min": min(lons),
                    "lon_max": max(lons),
                },
                grid=FieldGrid(latitudes=lats, longitudes=lons),
                values=sanitize_array(mag, fill_f),
                u=sanitize_array(u_arr, fill_f),
                v=sanitize_array(v_arr, fill_f),
                magnitude=sanitize_array(mag, fill_f),
                fill_value=fill_f,
                provenance=FieldProvenance(
                    dataset_id=self._dataset_id,
                    source_type="netcdf",
                    is_demo=False,
                    variable="current",
                    netcdf_variable="u,v",
                    selection_method=depth_info.selection_method,
                ),
            )
