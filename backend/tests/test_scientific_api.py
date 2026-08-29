"""Tests for new scientific API routes."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
FIXTURE = Path(__file__).resolve().parent / "fixtures" / "indian_ocean_sample.nc"


@pytest.fixture(scope="module", autouse=True)
def ensure_fixture():
    if not FIXTURE.is_file():
        from scripts.create_sample_netcdf import create_sample_netcdf

        create_sample_netcdf(FIXTURE)


def test_datasets_list():
    r = client.get("/api/datasets")
    assert r.status_code == 200
    data = r.json()
    assert "datasets" in data
    assert any(d["is_demo"] for d in data["datasets"])


def test_model_field_demo():
    r = client.get(
        "/api/model/field",
        params={
            "variable": "temperature",
            "time": "2026-08-24",
            "depth": 180,
            "south": 5,
            "north": 20,
            "west": 65,
            "east": 85,
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["provenance"]["is_demo"] is True
    assert body["depth_selection"]["selection_method"] == "between_levels"
    assert body["requested_depth"] == 180


def test_observations_query():
    r = client.get(
        "/api/observations",
        params={"platform_type": "argo", "variable": "temperature", "start_time": "2026-08-24"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["is_demo"] is True
    assert body["count"] > 0


def test_validation_platform():
    r = client.get(
        "/api/validation/platform/ARGO-001",
        params={"variable": "temperature", "depth": 180, "time": "2026-08-24"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["platform_id"] == "ARGO-001"
    assert body["is_demo"] is True
    assert body["matched_points"] > 0


def test_legacy_endpoints_still_work():
    assert client.get("/api/model/metadata").status_code == 200
    assert client.get("/api/model/temperature").status_code == 200
    assert client.get("/api/instruments").status_code == 200
