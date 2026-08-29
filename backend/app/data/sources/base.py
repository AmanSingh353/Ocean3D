"""Abstract data-source interfaces for model and observation backends."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.schemas.dataset import DatasetMetadata
from app.schemas.observation import ObservationQuery, ObservationRecord
from app.schemas.scientific import (
    DepthSelectionInfo,
    ModelFieldRequest,
    ModelFieldResponse,
)


class OceanModelDataSource(ABC):
    """Provides model grid metadata and spatial field subsets."""

    @property
    @abstractmethod
    def dataset_id(self) -> str: ...

    @property
    @abstractmethod
    def is_demo(self) -> bool: ...

    @abstractmethod
    def get_metadata(self) -> DatasetMetadata: ...

    @abstractmethod
    def get_field(self, request: ModelFieldRequest) -> ModelFieldResponse: ...

    @abstractmethod
    def resolve_depth(self, requested_depth: float) -> DepthSelectionInfo: ...


class ObservationDataSource(ABC):
    """Provides standardized observation records."""

    @property
    @abstractmethod
    def source_id(self) -> str: ...

    @property
    @abstractmethod
    def is_demo(self) -> bool: ...

    @abstractmethod
    def query(self, filters: ObservationQuery) -> list[ObservationRecord]: ...

    @abstractmethod
    def get_metadata(self) -> dict[str, Any]: ...
