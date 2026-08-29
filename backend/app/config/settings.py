"""Application configuration — env-driven data source selection."""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    """Runtime settings for Ocean3D backend."""

    # demo | netcdf | auto (netcdf if file exists, else demo)
    model_data_mode: str
    netcdf_model_path: Path | None
    netcdf_dataset_id: str
    demo_dataset_id: str

    @staticmethod
    def from_env() -> Settings:
        mode = os.getenv("OCEAN3D_MODEL_DATA_MODE", "demo").lower()
        path_str = os.getenv("OCEAN3D_NETCDF_PATH", "").strip()
        path = Path(path_str) if path_str else None
        if mode == "auto" and path and path.is_file():
            mode = "netcdf"
        return Settings(
            model_data_mode=mode,
            netcdf_model_path=path,
            netcdf_dataset_id=os.getenv("OCEAN3D_NETCDF_DATASET_ID", "netcdf-model"),
            demo_dataset_id=os.getenv("OCEAN3D_DEMO_DATASET_ID", "ocean3d-demo-synthetic"),
        )


settings = Settings.from_env()
