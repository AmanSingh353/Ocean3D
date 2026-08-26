import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_model_metadata():
    response = client.get("/api/model/metadata")
    assert response.status_code == 200
    data = response.json()
    assert data["region"]["lat_min"] == 5
    assert data["region"]["lon_max"] == 85
    assert len(data["variables"]) == 3
    assert data["depths"] == [0, 50, 100, 200, 500, 1000]
    assert len(data["dates"]) == 5


def test_model_temperature_defaults():
    response = client.get("/api/model/temperature")
    assert response.status_code == 200
    data = response.json()
    assert data["variable"] == "temperature"
    assert data["depth"] == 100
    assert data["date"] == "2026-08-24T00:00:00Z"
    assert len(data["grid"]["latitudes"]) == 16
    assert len(data["grid"]["longitudes"]) == 21
    assert len(data["values"]) == 16
    assert len(data["values"][0]) == 21


def test_model_temperature_with_params():
    response = client.get("/api/model/temperature?depth=100&date=2026-08-24")
    assert response.status_code == 200
    data = response.json()
    assert data["depth"] == 100
    assert all(8.0 <= row_val <= 31.0 for row in data["values"] for row_val in row)


def test_model_temperature_invalid_depth():
    response = client.get("/api/model/temperature?depth=75&date=2026-08-24")
    assert response.status_code == 422


def test_model_temperature_invalid_date():
    response = client.get("/api/model/temperature?depth=100&date=2026-08-19")
    assert response.status_code == 422


def test_list_instruments():
    response = client.get("/api/instruments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    ids = {item["id"] for item in data}
    assert ids == {"ARGO-001", "ARGO-014", "ARGO-021", "GLIDER-007"}


def test_instrument_profile():
    response = client.get("/api/instruments/ARGO-014/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["instrument_id"] == "ARGO-014"
    assert data["variable"] == "temperature"
    assert len(data["observations"]) == len(data["comparison"])
    assert data["observations"][0]["depth"] == 0


def test_instrument_not_found():
    response = client.get("/api/instruments/UNKNOWN/profile")
    assert response.status_code == 404


def test_temperature_is_deterministic():
    first = client.get("/api/model/temperature?depth=200&date=2026-08-22").json()
    second = client.get("/api/model/temperature?depth=200&date=2026-08-22").json()
    assert first["values"] == second["values"]
