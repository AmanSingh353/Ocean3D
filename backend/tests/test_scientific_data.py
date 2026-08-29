"""Tests for NetCDF inspection and scientific data layer."""

from __future__ import annotations

from pathlib import Path

import pytest

from app.data.sources.demo_model import DemoModelDataSource
from app.data.sources.netcdf_model import NetCDFModelDataSource
from app.processing.depth_resolver import resolve_depth_levels
from app.processing.netcdf_inspector import inspect_netcdf
from app.processing.quality import is_valid_coordinate, sanitize_scalar
from app.schemas.scientific import ModelFieldRequest
from app.validation.metrics import MatchedPair, compute_profile_validation, sample_at_depth

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "indian_ocean_sample.nc"


@pytest.fixture(scope="module", autouse=True)
def ensure_fixture():
    if not FIXTURE_PATH.is_file():
        from scripts.create_sample_netcdf import create_sample_netcdf

        create_sample_netcdf(FIXTURE_PATH)


def test_depth_resolver_between_levels():
    info = resolve_depth_levels(180.0, [0, 100, 200, 500])
    assert info.selection_method == "between_levels"
    assert info.available_lower_level == 100
    assert info.available_upper_level == 200
    assert info.nearest_level == 200
    assert info.interpolated is False


def test_depth_resolver_exact():
    info = resolve_depth_levels(100.0, [0, 100, 200])
    assert info.selection_method == "exact"


def test_netcdf_inspect_metadata():
    meta = inspect_netcdf(FIXTURE_PATH)
    assert "temperature" in {v["name"] for v in meta["variables"]}
    assert meta["depths"] == [0.0, 100.0, 200.0]
    assert len(meta["times"]) == 2


def test_netcdf_field_subset():
    src = NetCDFModelDataSource(FIXTURE_PATH, "test-netcdf")
    req = ModelFieldRequest(
        variable="temperature",
        time="2026-08-20T00:00:00Z",
        depth=180,
        south=5,
        north=10,
        west=65,
        east=70,
    )
    field = src.get_field(req)
    assert field.variable == "temperature"
    assert field.depth_selection.selection_method == "between_levels"
    assert field.requested_depth == 180
    assert field.depth == 200  # nearest level, not interpolated
    assert len(field.grid.latitudes) >= 1
    assert field.provenance.is_demo is False


def test_netcdf_missing_variable():
    src = NetCDFModelDataSource(FIXTURE_PATH, "test-netcdf")
    req = ModelFieldRequest(
        variable="chlorophyll",
        time="2026-08-20T00:00:00Z",
        depth=100,
    )
    with pytest.raises(ValueError, match="unavailable"):
        src.get_field(req)


def test_demo_model_field():
    src = DemoModelDataSource()
    req = ModelFieldRequest(
        variable="temperature",
        time="2026-08-24",
        depth=180,
        south=5,
        north=20,
        west=65,
        east=85,
    )
    field = src.get_field(req)
    assert field.provenance.is_demo is True
    assert field.depth_selection.available_lower_level == 100
    assert field.depth_selection.available_upper_level == 200


def test_validation_interpolation():
    pairs = [
        MatchedPair(100, 22.0, 21.5),
        MatchedPair(200, 20.0, 19.8),
    ]
    sample = sample_at_depth(pairs, 180)
    assert sample is not None
    assert sample.depth_match == "interpolated"
    assert sample.model == pytest.approx(20.4)
    stats = compute_profile_validation(pairs, 180, "temperature", "°C")
    assert stats["matched_points"] == 2
    assert stats["model"] is not None


def test_quality_helpers():
    assert is_valid_coordinate(12.0, 72.0)
    assert not is_valid_coordinate(999, 72.0)
    assert sanitize_scalar(float("nan")) is None
