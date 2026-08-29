"""Resolve requested depth against discrete model/profile levels."""

from __future__ import annotations

from app.schemas.scientific import DepthSelectionInfo


def resolve_depth_levels(
    requested_depth: float,
    available_depths: list[float],
) -> DepthSelectionInfo:
    """Pick bracketing levels without performing value interpolation."""
    if not available_depths:
        raise ValueError("No depth levels available in dataset")

    sorted_depths = sorted(float(d) for d in available_depths)
    nearest = min(sorted_depths, key=lambda d: abs(d - requested_depth))

    if any(abs(d - requested_depth) < 1e-6 for d in sorted_depths):
        level = next(d for d in sorted_depths if abs(d - requested_depth) < 1e-6)
        return DepthSelectionInfo(
            requested_depth=requested_depth,
            available_lower_level=level,
            available_upper_level=level,
            nearest_level=level,
            selection_method="exact",
            interpolated=False,
        )

    if requested_depth < sorted_depths[0]:
        return DepthSelectionInfo(
            requested_depth=requested_depth,
            available_lower_level=None,
            available_upper_level=sorted_depths[0],
            nearest_level=nearest,
            selection_method="below_range",
            interpolated=False,
        )

    if requested_depth > sorted_depths[-1]:
        return DepthSelectionInfo(
            requested_depth=requested_depth,
            available_lower_level=sorted_depths[-1],
            available_upper_level=None,
            nearest_level=nearest,
            selection_method="above_range",
            interpolated=False,
        )

    lower = sorted_depths[0]
    upper = sorted_depths[-1]
    for i in range(len(sorted_depths) - 1):
        if sorted_depths[i] <= requested_depth <= sorted_depths[i + 1]:
            lower = sorted_depths[i]
            upper = sorted_depths[i + 1]
            break

    return DepthSelectionInfo(
        requested_depth=requested_depth,
        available_lower_level=lower,
        available_upper_level=upper,
        nearest_level=nearest,
        selection_method="between_levels",
        interpolated=False,
    )
