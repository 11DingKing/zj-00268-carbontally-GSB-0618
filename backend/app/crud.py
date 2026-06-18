from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from . import database as models
from . import schemas
from .carbon_calc import SPECIES_BEF, calc_plot_carbon_series, get_data_quality_summary


def get_farms(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ForestFarm).offset(skip).limit(limit).all()


def get_farm(db: Session, farm_id: int):
    return db.query(models.ForestFarm).filter(models.ForestFarm.id == farm_id).first()


def create_farm(db: Session, farm: schemas.ForestFarmCreate):
    db_farm = models.ForestFarm(**farm.model_dump())
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm


def get_plots(
    db: Session,
    farm_id: Optional[int] = None,
    tree_species: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
):
    q = db.query(models.Plot)
    if farm_id:
        q = q.filter(models.Plot.farm_id == farm_id)
    if tree_species:
        q = q.filter(models.Plot.tree_species.contains(tree_species))
    return q.offset(skip).limit(limit).all()


def get_plot(db: Session, plot_id: int):
    return db.query(models.Plot).filter(models.Plot.id == plot_id).first()


def get_plot_by_code(db: Session, plot_code: str):
    return db.query(models.Plot).filter(models.Plot.plot_code == plot_code).first()


def create_plot(db: Session, plot: schemas.PlotCreate):
    db_plot = models.Plot(**plot.model_dump())
    db.add(db_plot)
    db.commit()
    db.refresh(db_plot)
    return db_plot


def update_plot(db: Session, plot_id: int, plot_update: schemas.PlotUpdate):
    db_plot = get_plot(db, plot_id)
    if not db_plot:
        return None
    for field, value in plot_update.model_dump(exclude_unset=True).items():
        setattr(db_plot, field, value)
    db.commit()
    db.refresh(db_plot)
    return db_plot


def get_growth_records(db: Session, plot_id: Optional[int] = None):
    q = db.query(models.GrowthRecord)
    if plot_id:
        q = q.filter(models.GrowthRecord.plot_id == plot_id)
    return q.order_by(models.GrowthRecord.record_year).all()


def get_growth_record(db: Session, record_id: int):
    return db.query(models.GrowthRecord).filter(models.GrowthRecord.id == record_id).first()


def create_growth_record(db: Session, gr: schemas.GrowthRecordCreate):
    existing = (
        db.query(models.GrowthRecord)
        .filter(
            models.GrowthRecord.plot_id == gr.plot_id,
            models.GrowthRecord.record_year == gr.record_year,
        )
        .first()
    )
    if existing:
        for field, value in gr.model_dump().items():
            if field != "plot_id" and field != "record_year":
                setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    db_gr = models.GrowthRecord(**gr.model_dump())
    db.add(db_gr)
    db.commit()
    db.refresh(db_gr)
    return db_gr


def update_growth_record(db: Session, record_id: int, gr: schemas.GrowthRecordUpdate):
    db_gr = get_growth_record(db, record_id)
    if not db_gr:
        return None
    for field, value in gr.model_dump(exclude_unset=True).items():
        setattr(db_gr, field, value)
    db.commit()
    db.refresh(db_gr)
    return db_gr


def delete_growth_record(db: Session, record_id: int):
    db_gr = get_growth_record(db, record_id)
    if db_gr:
        db.delete(db_gr)
        db.commit()
        return True
    return False


def get_researchers(db: Session, skip: int = 0, limit: int = 200):
    return db.query(models.Researcher).offset(skip).limit(limit).all()


def get_researcher(db: Session, researcher_id: int):
    return db.query(models.Researcher).filter(models.Researcher.id == researcher_id).first()


def create_researcher(db: Session, r: schemas.ResearcherCreate):
    db_r = models.Researcher(**r.model_dump())
    db.add(db_r)
    db.commit()
    db.refresh(db_r)
    return db_r


def update_researcher(db: Session, researcher_id: int, r: schemas.ResearcherUpdate):
    db_r = get_researcher(db, researcher_id)
    if not db_r:
        return None
    for field, value in r.model_dump(exclude_unset=True).items():
        setattr(db_r, field, value)
    db.commit()
    db.refresh(db_r)
    return db_r


def get_stewardships(
    db: Session, plot_id: Optional[int] = None, researcher_id: Optional[int] = None
):
    q = db.query(models.StewardshipRecord)
    if plot_id:
        q = q.filter(models.StewardshipRecord.plot_id == plot_id)
    if researcher_id:
        q = q.filter(models.StewardshipRecord.researcher_id == researcher_id)
    return q.order_by(models.StewardshipRecord.start_year).all()


def _normalize_stewardship_years(db: Session, plot_id: int, exclude_id: Optional[int] = None):
    records = db.query(models.StewardshipRecord).filter(models.StewardshipRecord.plot_id == plot_id)
    if exclude_id:
        records = records.filter(models.StewardshipRecord.id != exclude_id)
    records = records.order_by(models.StewardshipRecord.start_year).all()

    if len(records) < 2:
        return

    for i in range(len(records) - 1):
        current = records[i]
        next_rec = records[i + 1]
        expected_end = next_rec.start_year - 1
        if current.end_year != expected_end:
            current.end_year = expected_end
            db.add(current)


def create_stewardship(db: Session, sr: schemas.StewardshipRecordCreate):
    db_sr = models.StewardshipRecord(
        plot_id=sr.plot_id,
        researcher_id=sr.researcher_id,
        start_year=sr.start_year,
        end_year=sr.end_year,
        role=sr.role,
        breeding_work=sr.breeding_work,
        management_work=sr.management_work,
        key_achievements=sr.key_achievements,
        handover_notes=sr.handover_notes,
    )
    db.add(db_sr)
    db.flush()
    _normalize_stewardship_years(db, sr.plot_id)
    db.commit()
    db.refresh(db_sr)
    return db_sr


def update_stewardship(db: Session, sr_id: int, sr: schemas.StewardshipRecordUpdate):
    db_sr = db.query(models.StewardshipRecord).filter(models.StewardshipRecord.id == sr_id).first()
    if not db_sr:
        return None
    update_data = sr.model_dump(exclude_unset=True)
    year_changed = "start_year" in update_data or "end_year" in update_data
    plot_id = db_sr.plot_id

    for field, value in update_data.items():
        setattr(db_sr, field, value)

    if year_changed:
        db.flush()
        _normalize_stewardship_years(db, plot_id)

    db.commit()
    db.refresh(db_sr)
    return db_sr


def delete_stewardship(db: Session, sr_id: int):
    db_sr = db.query(models.StewardshipRecord).filter(models.StewardshipRecord.id == sr_id).first()
    if db_sr:
        plot_id = db_sr.plot_id
        db.delete(db_sr)
        db.flush()
        _normalize_stewardship_years(db, plot_id)
        db.commit()
        return True
    return False


def _plot_growth_tuples(db: Session, plot: models.Plot) -> List[Tuple[int, float]]:
    records = (
        db.query(models.GrowthRecord)
        .filter(models.GrowthRecord.plot_id == plot.id)
        .order_by(models.GrowthRecord.record_year)
        .all()
    )
    return [(r.record_year, r.volume_per_ha_m3) for r in records]


def calc_plot_carbon(db: Session, plot_id: int) -> Optional[Dict]:
    plot = get_plot(db, plot_id)
    if not plot:
        return None
    farm = get_farm(db, plot.farm_id)
    growth_tuples = _plot_growth_tuples(db, plot)
    yearly = calc_plot_carbon_series(
        tree_species=plot.tree_species,
        planting_year=plot.planting_year,
        area_hectare=plot.area_hectare,
        growth_records=growth_tuples,
    )
    quality_summary = get_data_quality_summary(yearly)

    if not yearly:
        return {
            "plot_id": plot.id,
            "plot_code": plot.plot_code,
            "plot_name": plot.plot_name,
            "tree_species": plot.tree_species,
            "area_hectare": plot.area_hectare,
            "planting_year": plot.planting_year,
            "farm_name": farm.name if farm else "",
            "total_stand_volume_m3": 0.0,
            "total_carbon_stock_t": 0.0,
            "total_carbon_sink_t": 0.0,
            "avg_annual_sink_t": 0.0,
            "yearly_results": [],
            "data_quality": quality_summary,
        }

    latest = yearly[-1]
    total_sink = sum(y.carbon_sink_t for y in yearly)
    years_span = (yearly[-1].year - yearly[0].year) if len(yearly) > 1 else 1
    avg_sink = total_sink / max(years_span, 1)

    return {
        "plot_id": plot.id,
        "plot_code": plot.plot_code,
        "plot_name": plot.plot_name,
        "tree_species": plot.tree_species,
        "area_hectare": plot.area_hectare,
        "planting_year": plot.planting_year,
        "farm_name": farm.name if farm else "",
        "total_stand_volume_m3": round(latest.volume_m3, 4),
        "total_carbon_stock_t": round(latest.carbon_stock_t, 4),
        "total_carbon_sink_t": round(total_sink, 4),
        "avg_annual_sink_t": round(avg_sink, 4),
        "yearly_results": [y.__dict__ for y in yearly],
        "data_quality": quality_summary,
    }


def calc_all_plots_carbon(db: Session) -> List[Dict]:
    plots = get_plots(db)
    results = []
    for p in plots:
        r = calc_plot_carbon(db, p.id)
        if r:
            results.append(r)
    return results


def summarize_by_farm(db: Session) -> List[Dict]:
    farms = get_farms(db)
    summaries = []
    for farm in farms:
        farm_plots = get_plots(db, farm_id=farm.id)
        plot_results = [calc_plot_carbon(db, p.id) for p in farm_plots]
        plot_results = [r for r in plot_results if r]

        total_area = sum(p.area_hectare for p in farm_plots)
        total_stock = sum(r["total_carbon_stock_t"] for r in plot_results)
        total_sink = sum(r["total_carbon_sink_t"] for r in plot_results)
        avg_sink = (
            (sum(r["avg_annual_sink_t"] for r in plot_results) / len(plot_results))
            if plot_results
            else 0
        )

        summaries.append(
            {
                "farm_id": farm.id,
                "farm_name": farm.name,
                "plot_count": len(farm_plots),
                "total_area_hectare": round(total_area, 4),
                "total_carbon_stock_t": round(total_stock, 4),
                "total_carbon_sink_t": round(total_sink, 4),
                "avg_annual_sink_t": round(avg_sink, 4),
            }
        )
    return summaries


def summarize_by_species(db: Session) -> List[Dict]:
    plots = get_plots(db)
    species_map: Dict[str, List[models.Plot]] = {}
    for p in plots:
        species_map.setdefault(p.tree_species, []).append(p)

    summaries = []
    for species, species_plots in species_map.items():
        plot_results = [calc_plot_carbon(db, p.id) for p in species_plots]
        plot_results = [r for r in plot_results if r]

        total_area = sum(p.area_hectare for p in species_plots)
        total_stock = sum(r["total_carbon_stock_t"] for r in plot_results)
        total_sink = sum(r["total_carbon_sink_t"] for r in plot_results)
        avg_sink = (
            (sum(r["avg_annual_sink_t"] for r in plot_results) / len(plot_results))
            if plot_results
            else 0
        )

        summaries.append(
            {
                "tree_species": species,
                "plot_count": len(species_plots),
                "total_area_hectare": round(total_area, 4),
                "total_carbon_stock_t": round(total_stock, 4),
                "total_carbon_sink_t": round(total_sink, 4),
                "avg_annual_sink_t": round(avg_sink, 4),
            }
        )
    summaries.sort(key=lambda x: x["total_carbon_stock_t"], reverse=True)
    return summaries


def get_plot_steward_timeline(db: Session, plot_id: int) -> Optional[Dict]:
    plot = get_plot(db, plot_id)
    if not plot:
        return None
    farm = get_farm(db, plot.farm_id)
    stewardships = get_stewardships(db, plot_id=plot_id)
    stewards_details = []
    for idx, sr in enumerate(stewardships):
        researcher = get_researcher(db, sr.researcher_id)
        if researcher:
            handover_status = "contiguous"
            gap_years = 0
            if idx > 0:
                prev = stewards_details[-1]
                prev_end = prev["end_year"]
                if prev_end is not None:
                    gap_years = sr.start_year - prev_end - 1
                    if gap_years > 0:
                        handover_status = "gap"
                    elif gap_years < 0:
                        handover_status = "overlap"
                    else:
                        handover_status = "contiguous"
                else:
                    handover_status = "contiguous"
            stewards_details.append(
                {
                    "stewardship_id": sr.id,
                    "researcher_id": researcher.id,
                    "name": researcher.name,
                    "title": researcher.title,
                    "institution": researcher.institution,
                    "avatar_color": researcher.avatar_color,
                    "join_year": researcher.join_year,
                    "start_year": sr.start_year,
                    "end_year": sr.end_year,
                    "role": sr.role,
                    "breeding_work": sr.breeding_work,
                    "management_work": sr.management_work,
                    "key_achievements": sr.key_achievements,
                    "handover_notes": sr.handover_notes,
                    "generation_index": idx + 1,
                    "handover_status": handover_status,
                    "gap_years": max(gap_years, 0),
                }
            )
    return {
        "plot_id": plot.id,
        "plot_code": plot.plot_code,
        "plot_name": plot.plot_name,
        "farm_name": farm.name if farm else "",
        "tree_species": plot.tree_species,
        "planting_year": plot.planting_year,
        "area_hectare": plot.area_hectare,
        "stewards": stewards_details,
    }


def get_species_params_list() -> List[Dict]:
    return [
        {
            "key": k,
            "name": v["name"],
            "bef": v["bef"],
            "carbon_fraction": v["carbon_fraction"],
            "root_to_shoot": v["root_to_shoot"],
        }
        for k, v in SPECIES_BEF.items()
    ]


def _calc_plot_carbon_for_period(
    db: Session,
    plot: models.Plot,
    start_year: int,
    end_year: int,
) -> Tuple[float, float, float]:
    growth_tuples = _plot_growth_tuples(db, plot)
    yearly = calc_plot_carbon_series(
        tree_species=plot.tree_species,
        planting_year=plot.planting_year,
        area_hectare=plot.area_hectare,
        growth_records=growth_tuples,
    )

    if not yearly:
        return 0.0, 0.0, 0.0

    start_stock = 0.0
    end_stock = 0.0

    for y in yearly:
        if y.year <= start_year:
            start_stock = y.carbon_stock_t
        if y.year <= end_year:
            end_stock = y.carbon_stock_t
        if y.year > end_year:
            break

    carbon_sink = end_stock - start_stock
    return round(carbon_sink, 4), round(start_stock, 4), round(end_stock, 4)


def _recalc_batch_totals(db: Session, batch: models.CarbonCertificationBatch):
    memberships = (
        db.query(models.BatchPlotMembership)
        .filter(models.BatchPlotMembership.batch_id == batch.id)
        .all()
    )

    total_carbon_sink = sum(m.carbon_sink_t for m in memberships)
    total_area = sum(m.area_hectare for m in memberships)
    plot_count = len(memberships)

    batch.total_carbon_sink_t = round(total_carbon_sink, 4)
    batch.total_area_hectare = round(total_area, 4)
    batch.plot_count = plot_count

    db.add(batch)


def get_batches(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.CarbonCertificationBatch)
        .order_by(models.CarbonCertificationBatch.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_batch(db: Session, batch_id: int):
    return (
        db.query(models.CarbonCertificationBatch)
        .filter(models.CarbonCertificationBatch.id == batch_id)
        .first()
    )


def get_batch_by_code(db: Session, batch_code: str):
    return (
        db.query(models.CarbonCertificationBatch)
        .filter(models.CarbonCertificationBatch.batch_code == batch_code)
        .first()
    )


def create_batch(db: Session, batch_data: schemas.CarbonCertificationBatchCreate):
    db_batch = models.CarbonCertificationBatch(
        batch_code=batch_data.batch_code,
        batch_name=batch_data.batch_name,
        start_year=batch_data.start_year,
        end_year=batch_data.end_year,
        description=batch_data.description,
    )
    db.add(db_batch)
    db.flush()

    if batch_data.plot_ids:
        for plot_id in batch_data.plot_ids:
            plot = get_plot(db, plot_id)
            if not plot:
                continue
            carbon_sink, start_stock, end_stock = _calc_plot_carbon_for_period(
                db, plot, batch_data.start_year, batch_data.end_year
            )
            membership = models.BatchPlotMembership(
                batch_id=db_batch.id,
                plot_id=plot_id,
                carbon_sink_t=carbon_sink,
                carbon_stock_start_t=start_stock,
                carbon_stock_end_t=end_stock,
                area_hectare=plot.area_hectare,
            )
            db.add(membership)

    db.flush()
    _recalc_batch_totals(db, db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch


def update_batch(db: Session, batch_id: int, batch_update: schemas.CarbonCertificationBatchUpdate):
    db_batch = get_batch(db, batch_id)
    if not db_batch:
        return None

    update_data = batch_update.model_dump(exclude_unset=True)
    start_year_changed = "start_year" in update_data
    end_year_changed = "end_year" in update_data

    for field, value in update_data.items():
        setattr(db_batch, field, value)

    if start_year_changed or end_year_changed:
        memberships = (
            db.query(models.BatchPlotMembership)
            .filter(models.BatchPlotMembership.batch_id == batch_id)
            .all()
        )
        for m in memberships:
            plot = get_plot(db, m.plot_id)
            if plot:
                carbon_sink, start_stock, end_stock = _calc_plot_carbon_for_period(
                    db, plot, db_batch.start_year, db_batch.end_year
                )
                m.carbon_sink_t = carbon_sink
                m.carbon_stock_start_t = start_stock
                m.carbon_stock_end_t = end_stock
                db.add(m)
        _recalc_batch_totals(db, db_batch)

    db.commit()
    db.refresh(db_batch)
    return db_batch


def delete_batch(db: Session, batch_id: int):
    db_batch = get_batch(db, batch_id)
    if not db_batch:
        return False
    db.delete(db_batch)
    db.commit()
    return True


def get_batch_memberships(db: Session, batch_id: int) -> List[Dict]:
    memberships = (
        db.query(models.BatchPlotMembership)
        .filter(models.BatchPlotMembership.batch_id == batch_id)
        .all()
    )

    result = []
    for m in memberships:
        plot = get_plot(db, m.plot_id)
        farm = get_farm(db, plot.farm_id) if plot else None
        result.append(
            {
                "id": m.id,
                "plot_id": m.plot_id,
                "plot_code": plot.plot_code if plot else "",
                "plot_name": plot.plot_name if plot else "",
                "tree_species": plot.tree_species if plot else "",
                "farm_name": farm.name if farm else "",
                "area_hectare": m.area_hectare,
                "planting_year": plot.planting_year if plot else 0,
                "carbon_sink_t": m.carbon_sink_t,
                "carbon_stock_start_t": m.carbon_stock_start_t,
                "carbon_stock_end_t": m.carbon_stock_end_t,
                "added_at": m.added_at,
            }
        )
    return result


def add_plots_to_batch(db: Session, batch_id: int, plot_ids: List[int]):
    db_batch = get_batch(db, batch_id)
    if not db_batch:
        return None

    existing_plot_ids = {
        m.plot_id
        for m in db.query(models.BatchPlotMembership)
        .filter(models.BatchPlotMembership.batch_id == batch_id)
        .all()
    }

    added_count = 0
    for plot_id in plot_ids:
        if plot_id in existing_plot_ids:
            continue
        plot = get_plot(db, plot_id)
        if not plot:
            continue
        carbon_sink, start_stock, end_stock = _calc_plot_carbon_for_period(
            db, plot, db_batch.start_year, db_batch.end_year
        )
        membership = models.BatchPlotMembership(
            batch_id=batch_id,
            plot_id=plot_id,
            carbon_sink_t=carbon_sink,
            carbon_stock_start_t=start_stock,
            carbon_stock_end_t=end_stock,
            area_hectare=plot.area_hectare,
        )
        db.add(membership)
        added_count += 1

    db.flush()
    _recalc_batch_totals(db, db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch, added_count


def remove_plots_from_batch(db: Session, batch_id: int, plot_ids: List[int]):
    db_batch = get_batch(db, batch_id)
    if not db_batch:
        return None

    removed = (
        db.query(models.BatchPlotMembership)
        .filter(
            models.BatchPlotMembership.batch_id == batch_id,
            models.BatchPlotMembership.plot_id.in_(plot_ids),
        )
        .delete(synchronize_session=False)
    )

    db.flush()
    _recalc_batch_totals(db, db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch, removed
