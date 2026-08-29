"""Create a small NetCDF test fixture for the Indian Ocean domain."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import numpy as np
import netCDF4 as nc


def create_sample_netcdf(output: Path) -> None:
    lats = np.linspace(5.0, 10.0, 6)
    lons = np.linspace(65.0, 70.0, 7)
    depths = np.array([0.0, 100.0, 200.0], dtype=float)
    times = nc.date2num(
        [datetime(2026, 8, 20), datetime(2026, 8, 21)],
        units="days since 2026-08-20 00:00:00",
        calendar="gregorian",
    )

    output.parent.mkdir(parents=True, exist_ok=True)
    with nc.Dataset(output, "w", format="NETCDF4") as ds:
        ds.createDimension("lat", len(lats))
        ds.createDimension("lon", len(lons))
        ds.createDimension("depth", len(depths))
        ds.createDimension("time", len(times))

        v_lat = ds.createVariable("lat", "f4", ("lat",))
        v_lon = ds.createVariable("lon", "f4", ("lon",))
        v_depth = ds.createVariable("depth", "f4", ("depth",))
        v_time = ds.createVariable("time", "f8", ("time",))
        v_lat[:] = lats
        v_lon[:] = lons
        v_depth[:] = depths
        v_time[:] = times
        v_time.units = "days since 2026-08-20 00:00:00"

        temp = ds.createVariable(
            "temperature", "f4", ("time", "depth", "lat", "lon"), fill_value=-999.0
        )
        sal = ds.createVariable(
            "salinity", "f4", ("time", "depth", "lat", "lon"), fill_value=-999.0
        )
        u = ds.createVariable("u", "f4", ("time", "depth", "lat", "lon"), fill_value=-999.0)
        v = ds.createVariable("v", "f4", ("time", "depth", "lat", "lon"), fill_value=-999.0)

        temp.units = "degC"
        sal.units = "PSU"
        u.units = "m s-1"
        v.units = "m s-1"

        for ti in range(len(times)):
            for di, d in enumerate(depths):
                base = 24.0 - 0.01 * d - 0.1 * ti
                temp[ti, di, :, :] = base + np.add.outer(lats * 0.1, lons * 0.05)
                sal[ti, di, :, :] = 35.0 - 0.002 * d + np.add.outer(lats * 0.01, lons * 0.01)
                u[ti, di, :, :] = 0.2 + 0.001 * d
                v[ti, di, :, :] = 0.1 + 0.0005 * d

        ds.title = "Ocean3D test fixture — NOT operational INCOIS data"
        ds.source = "Synthetic test generator"


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "indian_ocean_sample.nc"
    create_sample_netcdf(out)
    print(f"Wrote {out}")
