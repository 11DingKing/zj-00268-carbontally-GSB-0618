from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel


class DataQuality(str, Enum):
    MEASURED = "measured"
    INTERPOLATED = "interpolated"
    CORRECTED = "corrected"
    EXTRAPOLATED = "extrapolated"


SPECIES_BEF = {
    "杉木": {
        "bef": 0.65,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.22,
        "name": "杉木 (Cunninghamia lanceolata)",
    },
    "马尾松": {
        "bef": 0.58,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.24,
        "name": "马尾松 (Pinus massoniana)",
    },
    "湿地松": {
        "bef": 0.55,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.23,
        "name": "湿地松 (Pinus elliottii)",
    },
    "火炬松": {
        "bef": 0.56,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.24,
        "name": "火炬松 (Pinus taeda)",
    },
    "黑松": {
        "bef": 0.52,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.23,
        "name": "黑松 (Pinus thunbergii)",
    },
    "水杉": {
        "bef": 0.50,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.22,
        "name": "水杉 (Metasequoia glyptostroboides)",
    },
    "杨树": {
        "bef": 0.48,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.20,
        "name": "杨树 (Populus spp.)",
    },
    "柳树": {
        "bef": 0.47,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.21,
        "name": "柳树 (Salix spp.)",
    },
    "桉树": {
        "bef": 0.50,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.23,
        "name": "桉树 (Eucalyptus spp.)",
    },
    "樟树": {
        "bef": 0.53,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.24,
        "name": "樟树 (Cinnamomum camphora)",
    },
    "檫木": {
        "bef": 0.54,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.24,
        "name": "檫木 (Sassafras tzumu)",
    },
    "栎类": {
        "bef": 0.58,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.26,
        "name": "栎类 (Quercus spp.)",
    },
    "木荷": {
        "bef": 0.55,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.25,
        "name": "木荷 (Schima superba)",
    },
    "枫香": {
        "bef": 0.54,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.25,
        "name": "枫香 (Liquidambar formosana)",
    },
    "相思树": {
        "bef": 0.52,
        "carbon_fraction": 0.5,
        "root_to_shoot": 0.23,
        "name": "相思树 (Acacia spp.)",
    },
    "阔叶混交": {"bef": 0.55, "carbon_fraction": 0.5, "root_to_shoot": 0.25, "name": "阔叶混交林"},
    "针阔混交": {"bef": 0.56, "carbon_fraction": 0.5, "root_to_shoot": 0.24, "name": "针阔混交林"},
    "松柏混交": {"bef": 0.55, "carbon_fraction": 0.5, "root_to_shoot": 0.24, "name": "松柏混交林"},
}

DEFAULT_SPECIES_PARAMS = {"bef": 0.55, "carbon_fraction": 0.5, "root_to_shoot": 0.24}


def get_species_params(tree_species: str) -> Dict:
    for key, params in SPECIES_BEF.items():
        if key in tree_species or tree_species in key:
            return params
    return DEFAULT_SPECIES_PARAMS


@dataclass
class YearlyCarbonResult:
    year: int
    volume_m3: float
    biomass_aboveground_t: float
    biomass_total_t: float
    carbon_stock_t: float
    carbon_sink_t: float
    carbon_stock_per_ha_t: float
    carbon_sink_per_ha_t: float
    stand_age: int
    data_quality: str = DataQuality.MEASURED.value


@dataclass
class GrowthDataPoint:
    year: int
    volume_per_ha: float
    data_quality: str = DataQuality.MEASURED.value


def calc_year_carbon(
    tree_species: str,
    volume_per_ha_m3: float,
    area_hectare: float,
    record_year: int,
    planting_year: int,
    prev_carbon_stock: Optional[float] = None,
    data_quality: str = DataQuality.MEASURED.value,
) -> YearlyCarbonResult:
    params = get_species_params(tree_species)
    bef = params["bef"]
    carbon_fraction = params["carbon_fraction"]
    root_to_shoot = params["root_to_shoot"]

    volume_total = volume_per_ha_m3 * area_hectare
    biomass_ag = volume_total * bef
    biomass_total = biomass_ag * (1 + root_to_shoot)
    carbon_stock = biomass_total * carbon_fraction
    carbon_stock_per_ha = carbon_stock / area_hectare if area_hectare > 0 else 0

    carbon_sink = 0.0
    carbon_sink_per_ha = 0.0
    if prev_carbon_stock is not None:
        carbon_sink = carbon_stock - prev_carbon_stock
        carbon_sink_per_ha = carbon_sink / area_hectare if area_hectare > 0 else 0

    stand_age = record_year - planting_year

    return YearlyCarbonResult(
        year=record_year,
        volume_m3=round(volume_total, 4),
        biomass_aboveground_t=round(biomass_ag, 4),
        biomass_total_t=round(biomass_total, 4),
        carbon_stock_t=round(carbon_stock, 4),
        carbon_sink_t=round(carbon_sink, 4),
        carbon_stock_per_ha_t=round(carbon_stock_per_ha, 4),
        carbon_sink_per_ha_t=round(carbon_sink_per_ha, 4),
        stand_age=stand_age,
        data_quality=data_quality,
    )


def sanitize_and_interpolate_growth(
    growth_records: List[Tuple[int, float]],
    planting_year: int,
    max_decline_rate: float = 0.05,
) -> List[GrowthDataPoint]:
    if not growth_records:
        return []

    sorted_records = sorted(growth_records, key=lambda r: r[0])
    measured_points = [
        GrowthDataPoint(year=y, volume_per_ha=v, data_quality=DataQuality.MEASURED.value)
        for y, v in sorted_records
    ]

    n = len(measured_points)
    if n < 2:
        return measured_points

    is_anomaly = [False] * n
    for i in range(1, n):
        prev_vol = measured_points[i - 1].volume_per_ha
        curr_vol = measured_points[i].volume_per_ha
        if curr_vol < prev_vol:
            decline_rate = (prev_vol - curr_vol) / prev_vol
            if decline_rate > max_decline_rate:
                is_anomaly[i] = True

    corrected = [
        GrowthDataPoint(year=p.year, volume_per_ha=p.volume_per_ha, data_quality=p.data_quality)
        for p in measured_points
    ]
    for i in range(n):
        if is_anomaly[i]:
            left_idx = i - 1
            while left_idx >= 0 and is_anomaly[left_idx]:
                left_idx -= 1
            right_idx = i + 1
            while right_idx < n and is_anomaly[right_idx]:
                right_idx += 1

            if left_idx >= 0 and right_idx < n:
                left_p = measured_points[left_idx]
                right_p = measured_points[right_idx]
                year_gap = right_p.year - left_p.year
                vol_diff = right_p.volume_per_ha - left_p.volume_per_ha
                ratio = (corrected[i].year - left_p.year) / year_gap
                interp_vol = left_p.volume_per_ha + vol_diff * ratio
                corrected[i].volume_per_ha = round(interp_vol, 4)
                corrected[i].data_quality = DataQuality.CORRECTED.value
            elif left_idx >= 0:
                avg_growth_rate = 0.05
                years = corrected[i].year - measured_points[left_idx].year
                est_vol = measured_points[left_idx].volume_per_ha * ((1 + avg_growth_rate) ** years)
                corrected[i].volume_per_ha = round(est_vol, 4)
                corrected[i].data_quality = DataQuality.CORRECTED.value
            elif right_idx < n:
                avg_growth_rate = 0.05
                years = measured_points[right_idx].year - corrected[i].year
                est_vol = measured_points[right_idx].volume_per_ha / (
                    (1 + avg_growth_rate) ** years
                )
                corrected[i].volume_per_ha = round(est_vol, 4)
                corrected[i].data_quality = DataQuality.CORRECTED.value

    interpolated: List[GrowthDataPoint] = []
    for i in range(len(corrected) - 1):
        curr = corrected[i]
        next_p = corrected[i + 1]
        interpolated.append(curr)

        year_gap = next_p.year - curr.year
        if year_gap > 1:
            vol_diff = next_p.volume_per_ha - curr.volume_per_ha
            vol_per_year = vol_diff / year_gap
            for y in range(curr.year + 1, next_p.year):
                interp_vol = curr.volume_per_ha + vol_per_year * (y - curr.year)
                interpolated.append(
                    GrowthDataPoint(
                        year=y,
                        volume_per_ha=round(interp_vol, 4),
                        data_quality=DataQuality.INTERPOLATED.value,
                    )
                )

    interpolated.append(corrected[-1])

    return interpolated


def calc_plot_carbon_series(
    tree_species: str,
    planting_year: int,
    area_hectare: float,
    growth_records: List[Tuple[int, float]],
    enable_sanitize: bool = True,
) -> List[YearlyCarbonResult]:
    if enable_sanitize:
        data_points = sanitize_and_interpolate_growth(
            growth_records=growth_records,
            planting_year=planting_year,
        )
    else:
        data_points = [
            GrowthDataPoint(year=y, volume_per_ha=v)
            for y, v in sorted(growth_records, key=lambda r: r[0])
        ]

    results = []
    prev_carbon = None

    for point in data_points:
        r = calc_year_carbon(
            tree_species=tree_species,
            volume_per_ha_m3=point.volume_per_ha,
            area_hectare=area_hectare,
            record_year=point.year,
            planting_year=planting_year,
            prev_carbon_stock=prev_carbon,
            data_quality=point.data_quality,
        )
        results.append(r)
        prev_carbon = r.carbon_stock_t

    return results


def get_data_quality_summary(yearly_results: List[YearlyCarbonResult]) -> Dict:
    total = len(yearly_results)
    measured = sum(1 for y in yearly_results if y.data_quality == DataQuality.MEASURED.value)
    interpolated = sum(
        1 for y in yearly_results if y.data_quality == DataQuality.INTERPOLATED.value
    )
    corrected = sum(1 for y in yearly_results if y.data_quality == DataQuality.CORRECTED.value)
    extrapolated = sum(
        1 for y in yearly_results if y.data_quality == DataQuality.EXTRAPOLATED.value
    )

    return {
        "total_years": total,
        "measured_years": measured,
        "interpolated_years": interpolated,
        "corrected_years": corrected,
        "extrapolated_years": extrapolated,
        "has_missing_data": interpolated > 0 or extrapolated > 0,
        "has_anomalies": corrected > 0,
        "data_completeness": round(measured / total, 4) if total > 0 else 0,
    }


class PlotCarbonSummary(BaseModel):
    plot_id: int
    plot_code: str
    plot_name: str
    tree_species: str
    area_hectare: float
    planting_year: int
    total_stand_volume_m3: float
    total_carbon_stock_t: float
    total_carbon_sink_t: float
    avg_annual_sink_t: float
    yearly_results: List[Dict]
