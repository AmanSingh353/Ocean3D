# Ocean3D Backend — Scientific Data Layer

Backend for the Ocean3D Indian Ocean visualization and validation platform.

## Architecture

```
app/
  api/                 # FastAPI routes
    routes_model.py    # Legacy demo model endpoints (unchanged)
    routes_scientific.py  # New scientific data API
  config/              # Environment-driven settings
  data/
    registry.py        # Demo vs NetCDF source selection
    sources/           # OceanModelDataSource / ObservationDataSource adapters
  processing/          # NetCDF inspect, depth resolve, QC
  validation/          # Server-side validation metrics
  schemas/             # Pydantic response models
  services/            # Legacy synthetic services (still used by demo adapters)
```

### Data adapter pattern

| Adapter | Purpose |
|---------|---------|
| `DemoModelDataSource` | Wraps existing synthetic `OceanDataService` |
| `NetCDFModelDataSource` | Lazy xarray subset reads from NetCDF |
| `DemoObservationDataSource` | Materializes demo Argo/glider profiles |

Future adapters: `INCOISDataSource`, `ArgoDataSource` — implement the same base interfaces.

## Running the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OCEAN3D_MODEL_DATA_MODE` | `demo` | `demo`, `netcdf`, or `auto` |
| `OCEAN3D_NETCDF_PATH` | — | Path to NetCDF model file |
| `OCEAN3D_NETCDF_DATASET_ID` | `netcdf-model` | Dataset catalog id |

Example (enable NetCDF when file exists):

```bash
export OCEAN3D_MODEL_DATA_MODE=netcdf
export OCEAN3D_NETCDF_PATH=/data/incois/forecast_sample.nc
uvicorn app.main:app --reload
```

## API endpoints

### Legacy demo (unchanged — used by current frontend)

- `GET /api/health`
- `GET /api/model/metadata`
- `GET /api/model/temperature?depth=&date=`
- `GET /api/salinity`, `/api/current`, `/api/chlorophyll`
- `GET /api/instruments`, `/api/instruments/{id}/profile`

### Scientific data layer (new)

- `GET /api/datasets` — list dataset metadata
- `GET /api/datasets/{dataset_id}` — single dataset metadata
- `GET /api/model/field?variable=&time=&depth=&north=&south=&east=&west=` — spatial subset
- `GET /api/observations?platform_type=&variable=&...` — standardized observations
- `GET /api/validation/platform/{id}?variable=&depth=&time=` — server validation

### Example: model field

```http
GET /api/model/field?variable=temperature&time=2026-08-24&depth=180&south=5&north=20&west=65&east=85
```

Response includes:

- `requested_depth`, `depth` (nearest level used)
- `depth_selection` with `available_lower_level`, `available_upper_level`, `selection_method`
- `provenance.is_demo` flag
- `values` as 2D grid aligned with `grid.latitudes` / `grid.longitudes`

**Important:** Vertical interpolation is **not** performed silently. When requested depth falls between levels, the API reports bracketing levels and uses the **nearest** level for the slice unless interpolation is explicitly added later.

## NetCDF requirements

Expected structure (CF-compatible):

- Coordinates: `lat/latitude`, `lon/longitude`, `depth`, `time`
- Variables (any matching alias): `temperature`, `salinity`, `u`, `v`, `chlorophyll`
- Attributes: `units`, `_FillValue` or `missing_value`

Create a test fixture:

```bash
python scripts/create_sample_netcdf.py
```

Output: `tests/fixtures/indian_ocean_sample.nc`

## Adding a new dataset

1. Place NetCDF file on disk or object storage
2. Set `OCEAN3D_NETCDF_PATH`
3. Set `OCEAN3D_MODEL_DATA_MODE=netcdf`
4. Verify with `GET /api/datasets`

## Adding a new variable

1. Add alias mapping in `app/processing/netcdf_inspector.py`
2. Add unit mapping in `DemoModelDataSource` / field converters
3. Extend frontend `OceanVariable` and color utilities

## Adding an observation source

1. Implement `ObservationDataSource` in `app/data/sources/`
2. Register in `app/data/registry.py`
3. Wire ingest pipeline to populate standardized `ObservationRecord` rows

## Tests

```bash
cd backend
pytest -q
```

## Frontend integration

The frontend defaults to **demo mode** via `VITE_OCEAN3D_DATA_MODE=demo`.

Provider layer: `frontend/src/data/providers/`

- `DemoDataProvider` — current behavior (default)
- `APIDataProvider` — uses `/api/model/field` (future switch)

Set `VITE_OCEAN3D_DATA_MODE=api` to experiment without changing visualization components.
