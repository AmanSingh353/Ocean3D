"""Basic quality-control helpers — extensible for dataset-specific rules."""

from __future__ import annotations

import math
from typing import Any

import numpy as np


def is_valid_coordinate(lat: float | None, lon: float | None) -> bool:
    if lat is None or lon is None:
        return False
    if not math.isfinite(lat) or not math.isfinite(lon):
        return False
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 360.0


def is_valid_depth(depth: float | None, max_depth: float = 12000.0) -> bool:
    if depth is None or not math.isfinite(depth):
        return False
    return 0.0 <= depth <= max_depth


def sanitize_scalar(value: Any, fill_value: float | None = None) -> float | None:
    """Convert masked/NaN values to None for JSON responses."""
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(f):
        return None
    if fill_value is not None and abs(f - fill_value) < 1e-12:
        return None
    return f


def sanitize_array(values: np.ndarray, fill_value: float | None = None) -> list[list[float | None]]:
    """2D array → JSON-safe grid with None for missing."""
    out: list[list[float | None]] = []
    for row in values:
        out_row: list[float | None] = []
        for v in row:
            if np.ma.is_masked(v):
                out_row.append(None)
            else:
                out_row.append(sanitize_scalar(v, fill_value))
        out.append(out_row)
    return out
