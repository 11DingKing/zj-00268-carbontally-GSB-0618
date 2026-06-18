from datetime import date, datetime
from typing import Dict, List, Optional

from pydantic import BaseModel


class ForestFarmBase(BaseModel):
    name: str
    location: Optional[str] = None
    region: Optional[str] = None
    established_year: Optional[int] = None
    description: Optional[str] = None


class ForestFarmCreate(ForestFarmBase):
    pass


class ForestFarm(ForestFarmBase):
    id: int

    class Config:
        from_attributes = True


class GrowthRecordBase(BaseModel):
    record_year: int
    mean_height_m: Optional[float] = None
    mean_dbh_cm: Optional[float] = None
    volume_per_ha_m3: float
    mortality_rate: Optional[float] = 0.0
    survey_date: Optional[date] = None
    survey_method: Optional[str] = None
    surveyors: Optional[str] = None
    remarks: Optional[str] = None


class GrowthRecordCreate(GrowthRecordBase):
    plot_id: int


class GrowthRecordUpdate(GrowthRecordBase):
    pass


class GrowthRecord(GrowthRecordBase):
    id: int
    plot_id: int

    class Config:
        from_attributes = True


class PlotBase(BaseModel):
    farm_id: int
    plot_code: str
    plot_name: str
    tree_species: str
    planting_year: int
    area_hectare: float
    elevation: Optional[float] = None
    soil_type: Optional[str] = None
    initial_density: Optional[int] = None
    notes: Optional[str] = None


class PlotCreate(PlotBase):
    pass


class PlotUpdate(BaseModel):
    farm_id: Optional[int] = None
    plot_code: Optional[str] = None
    plot_name: Optional[str] = None
    tree_species: Optional[str] = None
    planting_year: Optional[int] = None
    area_hectare: Optional[float] = None
    elevation: Optional[float] = None
    soil_type: Optional[str] = None
    initial_density: Optional[int] = None
    notes: Optional[str] = None


class Plot(PlotBase):
    id: int
    growth_records: List[GrowthRecord] = []

    class Config:
        from_attributes = True


class PlotWithFarm(Plot):
    farm: ForestFarm


class ResearcherBase(BaseModel):
    name: str
    gender: Optional[str] = None
    birth_year: Optional[int] = None
    title: Optional[str] = None
    institution: Optional[str] = None
    specialty: Optional[str] = None
    join_year: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar_color: Optional[str] = "#4f7942"


class ResearcherCreate(ResearcherBase):
    pass


class ResearcherUpdate(ResearcherBase):
    pass


class Researcher(ResearcherBase):
    id: int

    class Config:
        from_attributes = True


class StewardshipRecordBase(BaseModel):
    plot_id: int
    researcher_id: int
    start_year: int
    end_year: Optional[int] = None
    role: Optional[str] = None
    breeding_work: Optional[str] = None
    management_work: Optional[str] = None
    key_achievements: Optional[str] = None
    handover_notes: Optional[str] = None


class StewardshipRecordCreate(StewardshipRecordBase):
    pass


class StewardshipRecordUpdate(StewardshipRecordBase):
    pass


class StewardshipRecord(StewardshipRecordBase):
    id: int

    class Config:
        from_attributes = True


class StewardshipWithDetails(StewardshipRecord):
    researcher: Researcher
    plot: Plot


class DataQualitySummary(BaseModel):
    total_years: int
    measured_years: int
    interpolated_years: int
    corrected_years: int
    extrapolated_years: int
    has_missing_data: bool
    has_anomalies: bool
    data_completeness: float


class YearlyCarbonItem(BaseModel):
    year: int
    volume_m3: float
    biomass_aboveground_t: float
    biomass_total_t: float
    carbon_stock_t: float
    carbon_sink_t: float
    carbon_stock_per_ha_t: float
    carbon_sink_per_ha_t: float
    stand_age: int
    data_quality: str = "measured"


class PlotCarbonDetail(BaseModel):
    plot_id: int
    plot_code: str
    plot_name: str
    tree_species: str
    area_hectare: float
    planting_year: int
    farm_name: str
    total_stand_volume_m3: float
    total_carbon_stock_t: float
    total_carbon_sink_t: float
    avg_annual_sink_t: float
    yearly_results: List[YearlyCarbonItem]
    data_quality: DataQualitySummary


class FarmSummaryItem(BaseModel):
    farm_id: int
    farm_name: str
    plot_count: int
    total_area_hectare: float
    total_carbon_stock_t: float
    total_carbon_sink_t: float
    avg_annual_sink_t: float


class SpeciesSummaryItem(BaseModel):
    tree_species: str
    plot_count: int
    total_area_hectare: float
    total_carbon_stock_t: float
    total_carbon_sink_t: float
    avg_annual_sink_t: float


class PlotStewardTimeline(BaseModel):
    plot_id: int
    plot_code: str
    plot_name: str
    farm_name: str
    tree_species: str
    planting_year: int
    area_hectare: float
    stewards: List[Dict]


class CarbonSpeciesParams(BaseModel):
    key: str
    name: str
    bef: float
    carbon_fraction: float
    root_to_shoot: float


class BatchPlotMembershipBase(BaseModel):
    plot_id: int


class BatchPlotMembershipCreate(BatchPlotMembershipBase):
    pass


class BatchPlotMembershipDetail(BaseModel):
    id: int
    plot_id: int
    plot_code: str
    plot_name: str
    tree_species: str
    farm_name: str
    area_hectare: float
    planting_year: int
    carbon_sink_t: float
    carbon_stock_start_t: float
    carbon_stock_end_t: float
    added_at: datetime

    class Config:
        from_attributes = True


class CarbonCertificationBatchBase(BaseModel):
    batch_code: str
    batch_name: str
    start_year: int
    end_year: int
    description: Optional[str] = None


class CarbonCertificationBatchCreate(CarbonCertificationBatchBase):
    plot_ids: Optional[List[int]] = None


class CarbonCertificationBatchUpdate(BaseModel):
    batch_name: Optional[str] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    description: Optional[str] = None


class CarbonCertificationBatch(CarbonCertificationBatchBase):
    id: int
    total_carbon_sink_t: float
    total_area_hectare: float
    plot_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CarbonCertificationBatchDetail(CarbonCertificationBatch):
    memberships: List[BatchPlotMembershipDetail] = []


class AddPlotsToBatch(BaseModel):
    plot_ids: List[int]


class RemovePlotsFromBatch(BaseModel):
    plot_ids: List[int]
