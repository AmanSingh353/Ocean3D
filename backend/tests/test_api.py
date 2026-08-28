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
    assert len(data["variables"]) == 4
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


def test_current_field_defaults():
    response = client.get("/api/current")
    assert response.status_code == 200
    data = response.json()
    assert data["variable"] == "current"
    assert data["unit"] == "m/s"
    assert data["depth"] == 100
    assert len(data["u"]) == 16
    assert len(data["v"]) == 16
    assert len(data["magnitude"]) == 16


def test_current_field_with_depth():
    response = client.get("/api/current?depth=300&date=2026-08-24")
    assert response.status_code == 200
    data = response.json()
    assert data["depth"] == 300
    assert data["u"][0][0] != 0 or data["v"][0][0] != 0


def test_current_field_depth_500_differs_from_100():
    shallow = client.get("/api/current?depth=100&date=2026-08-24").json()
    deep = client.get("/api/current?depth=500&date=2026-08-24").json()
    assert shallow["magnitude"] != deep["magnitude"]


def test_current_field_invalid_depth():
    response = client.get("/api/current?depth=1500&date=2026-08-24")
    assert response.status_code == 422


def test_salinity_field_defaults():
    response = client.get("/api/salinity")
    assert response.status_code == 200
    data = response.json()
    assert data["variable"] == "salinity"
    assert data["unit"] == "PSU"
    assert data["depth"] == 100
    assert len(data["grid"]["latitudes"]) == 16
    assert len(data["grid"]["longitudes"]) == 21
    assert len(data["values"]) == 16
    assert len(data["values"][0]) == 21


def test_salinity_field_with_depth():
    response = client.get("/api/salinity?depth=300&date=2026-08-24")
    assert response.status_code == 200
    data = response.json()
    assert data["depth"] == 300
    assert all(30.0 <= row_val <= 37.0 for row in data["values"] for row_val in row)


def test_salinity_field_depth_500_differs_from_100():
    shallow = client.get("/api/salinity?depth=100&date=2026-08-24").json()
    deep = client.get("/api/salinity?depth=500&date=2026-08-24").json()
    assert shallow["values"] != deep["values"]


def test_salinity_field_invalid_depth():
    response = client.get("/api/salinity?depth=1500&date=2026-08-24")
    assert response.status_code == 422


def test_salinity_is_deterministic():
    first = client.get("/api/salinity?depth=200&date=2026-08-22").json()
    second = client.get("/api/salinity?depth=200&date=2026-08-22").json()
    assert first["values"] == second["values"]
