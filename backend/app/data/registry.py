"""Central registry — selects demo vs NetCDF model sources."""

from __future__ import annotations

from pathlib import Path

from app.config.settings import settings
from app.data.sources.base import ObservationDataSource, OceanModelDataSource
from app.data.sources.demo_model import DemoModelDataSource
from app.data.sources.demo_observations import DemoObservationDataSource
from app.data.sources.netcdf_model import NetCDFModelDataSource


class DataSourceRegistry:
    def __init__(self) -> None:
        self._demo_model = DemoModelDataSource()
        self._demo_obs = DemoObservationDataSource()
        self._netcdf_model: NetCDFModelDataSource | None = None
        self._refresh_netcdf()

    def _refresh_netcdf(self) -> None:
        path = settings.netcdf_model_path
        if settings.model_data_mode == "netcdf" and path and path.is_file():
            self._netcdf_model = NetCDFModelDataSource(path, settings.netcdf_dataset_id)
        else:
            self._netcdf_model = None

    def get_model_source(self, dataset_id: str | None = None) -> OceanModelDataSource:
        if dataset_id and dataset_id == self._demo_model.dataset_id:
            return self._demo_model
        if dataset_id and self._netcdf_model and dataset_id == self._netcdf_model.dataset_id:
            return self._netcdf_model
        if settings.model_data_mode == "netcdf" and self._netcdf_model:
            return self._netcdf_model
        return self._demo_model

    def get_observation_source(self) -> ObservationDataSource:
        return self._demo_obs

    def list_model_sources(self) -> list[OceanModelDataSource]:
        sources: list[OceanModelDataSource] = [self._demo_model]
        if self._netcdf_model:
            sources.append(self._netcdf_model)
        return sources

    def register_netcdf(self, path: Path, dataset_id: str | None = None) -> None:
        ds_id = dataset_id or settings.netcdf_dataset_id
        self._netcdf_model = NetCDFModelDataSource(path, ds_id)


data_registry = DataSourceRegistry()
