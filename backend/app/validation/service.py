"""Validation service — combines model and observation sources."""

from __future__ import annotations

from app.data.registry import data_registry
from app.schemas.observation import ObservationQuery
from app.schemas.scientific import ValidationPointResponse
from app.services.instrument_data import instrument_data_service
from app.validation.metrics import MatchedPair, compute_profile_validation


class ValidationService:
    def validate_platform(
        self,
        platform_id: str,
        variable: str,
        depth: float,
        time: str,
    ) -> ValidationPointResponse:
        date = time[:10]
        profile = instrument_data_service.get_profile(platform_id, date=date)

        pairs: list[MatchedPair] = []
        for obs, comp in zip(profile.observations, profile.comparison):
            if variable == "temperature":
                pairs.append(MatchedPair(obs.depth, comp.model, obs.value))
            elif variable == "salinity" and comp.salinity_model is not None and comp.salinity_observation is not None:
                pairs.append(MatchedPair(obs.depth, comp.salinity_model, comp.salinity_observation))
            elif variable == "chlorophyll" and comp.chlorophyll_model is not None and comp.chlorophyll_observation is not None:
                pairs.append(MatchedPair(obs.depth, comp.chlorophyll_model, comp.chlorophyll_observation))
            elif variable == "current" and comp.current_model is not None and comp.current_observation is not None:
                pairs.append(MatchedPair(obs.depth, comp.current_model, comp.current_observation))

        unit_map = {"temperature": "°C", "salinity": "PSU", "chlorophyll": "mg/m³", "current": "m/s"}
        stats = compute_profile_validation(pairs, depth, variable, unit_map.get(variable, ""))

        depth_selection = data_registry.get_model_source().resolve_depth(depth)

        return ValidationPointResponse(
            variable=variable,
            unit=unit_map.get(variable, ""),
            platform_id=platform_id,
            compared_depth=depth,
            depth_selection=depth_selection,
            model=stats.get("model"),
            observation=stats.get("observation"),
            difference=stats.get("difference"),
            bias=stats.get("bias"),
            absolute_error=stats.get("absolute_error"),
            mean_bias=stats.get("mean_bias"),
            mae=stats.get("mae"),
            rmse=stats.get("rmse"),
            correlation=stats.get("correlation"),
            matched_points=stats.get("matched_points", 0),
            validation_status=stats.get("validation_status"),
            is_demo=True,
            depth_sample_error=stats.get("depth_sample_error"),
        )


validation_service = ValidationService()
