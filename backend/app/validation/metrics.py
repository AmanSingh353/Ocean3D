"""Validation metrics — server-side foundation matching frontend semantics."""

from __future__ import annotations

import math
from dataclasses import dataclass

RMSE_THRESHOLDS = {
    "temperature": (0.5, 1.0),
    "salinity": (0.15, 0.35),
    "chlorophyll": (0.1, 0.25),
    "current": (0.05, 0.15),
}


@dataclass
class MatchedPair:
    depth: float
    model: float
    observation: float


@dataclass
class DepthSample:
    model: float
    observation: float
    depth_match: str
    bracket_lower: float
    bracket_upper: float


def sample_at_depth(pairs: list[MatchedPair], depth: float) -> DepthSample | None:
    if not pairs:
        return None
    sorted_pairs = sorted(pairs, key=lambda p: p.depth)
    for p in sorted_pairs:
        if abs(p.depth - depth) < 1e-6:
            return DepthSample(
                model=p.model,
                observation=p.observation,
                depth_match="exact",
                bracket_lower=p.depth,
                bracket_upper=p.depth,
            )
    if depth < sorted_pairs[0].depth or depth > sorted_pairs[-1].depth:
        return None
    lower = sorted_pairs[0]
    upper = sorted_pairs[-1]
    for i in range(len(sorted_pairs) - 1):
        if sorted_pairs[i].depth <= depth <= sorted_pairs[i + 1].depth:
            lower = sorted_pairs[i]
            upper = sorted_pairs[i + 1]
            break
    span = upper.depth - lower.depth
    if span <= 0:
        return None
    t = (depth - lower.depth) / span
    return DepthSample(
        model=lower.model + t * (upper.model - lower.model),
        observation=lower.observation + t * (upper.observation - lower.observation),
        depth_match="interpolated",
        bracket_lower=lower.depth,
        bracket_upper=upper.depth,
    )


def pearson_correlation(pairs: list[MatchedPair]) -> float | None:
    if len(pairs) < 2:
        return None
    xs = [p.model for p in pairs]
    ys = [p.observation for p in pairs]
    n = len(xs)
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den_x = math.sqrt(sum((x - mx) ** 2 for x in xs))
    den_y = math.sqrt(sum((y - my) ** 2 for y in ys))
    if den_x <= 0 or den_y <= 0:
        return None
    return round(num / (den_x * den_y), 4)


def validation_status(rmse: float, variable: str) -> str:
    good, moderate = RMSE_THRESHOLDS.get(variable, (0.5, 1.0))
    if rmse <= good:
        return "GOOD"
    if rmse <= moderate:
        return "MODERATE"
    return "POOR"


def compute_profile_validation(
    pairs: list[MatchedPair],
    compared_depth: float,
    variable: str,
    unit: str,
) -> dict:
    if not pairs:
        return {
            "variable": variable,
            "unit": unit,
            "matched_points": 0,
            "depth_sample_error": "no_pairs",
        }

    errors = [p.observation - p.model for p in pairs]
    abs_errors = [abs(e) for e in errors]
    mean_bias = sum(errors) / len(errors)
    mae = sum(abs_errors) / len(abs_errors)
    rmse = math.sqrt(sum(e * e for e in errors) / len(errors))
    corr = pearson_correlation(pairs)
    depth_sample = sample_at_depth(pairs, compared_depth)

    result = {
        "variable": variable,
        "unit": unit,
        "compared_depth": compared_depth,
        "mean_bias": round(mean_bias, 4),
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "correlation": corr,
        "matched_points": len(pairs),
        "validation_status": validation_status(rmse, variable),
        "model": None,
        "observation": None,
        "difference": None,
        "bias": None,
        "absolute_error": None,
        "depth_sample_error": None,
    }

    if depth_sample:
        diff = depth_sample.model - depth_sample.observation
        result.update(
            {
                "model": round(depth_sample.model, 4),
                "observation": round(depth_sample.observation, 4),
                "difference": round(diff, 4),
                "bias": round(depth_sample.observation - depth_sample.model, 4),
                "absolute_error": round(abs(diff), 4),
                "depth_match": depth_sample.depth_match,
                "model_level_lower": depth_sample.bracket_lower,
                "model_level_upper": depth_sample.bracket_upper,
            }
        )
    else:
        result["depth_sample_error"] = (
            "below_range" if compared_depth < pairs[0].depth else "above_range"
        )

    return result
