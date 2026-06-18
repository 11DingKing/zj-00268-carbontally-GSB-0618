from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, schemas
from .database import Base, engine, get_db
from .seed import init_seed_data

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="人工林碳增汇核算与守绿代际台账平台",
    description="后台维护人工林地块的树种、造林年份、面积和历年长势数据，核算每个地块逐年的碳储量和碳增汇量，并记录代际接力的守绿台账。",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        init_seed_data(db)
        from .crud import _normalize_stewardship_years

        all_plots = crud.get_plots(db, limit=10000)
        for p in all_plots:
            _normalize_stewardship_years(db, p.id)
        db.commit()
    finally:
        db.close()


@app.get("/health")
def health_check():
    from sqlalchemy import text

    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "service": "carbon-backend"}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"status": "unhealthy", "error": str(e)})


@app.get("/")
def read_root():
    return {
        "name": "人工林碳增汇核算与守绿代际台账平台",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/farms", response_model=List[schemas.ForestFarm])
def list_farms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_farms(db, skip=skip, limit=limit)


@app.get("/farms/{farm_id}", response_model=schemas.ForestFarm)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = crud.get_farm(db, farm_id)
    if not farm:
        raise HTTPException(status_code=404, detail="林场不存在")
    return farm


@app.post("/farms", response_model=schemas.ForestFarm)
def create_farm(farm: schemas.ForestFarmCreate, db: Session = Depends(get_db)):
    return crud.create_farm(db, farm)


@app.get("/plots", response_model=List[schemas.Plot])
def list_plots(
    farm_id: Optional[int] = Query(None),
    tree_species: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
):
    return crud.get_plots(db, farm_id=farm_id, tree_species=tree_species, skip=skip, limit=limit)


@app.get("/plots/{plot_id}", response_model=schemas.Plot)
def get_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = crud.get_plot(db, plot_id)
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    return plot


@app.post("/plots", response_model=schemas.Plot)
def create_plot(plot: schemas.PlotCreate, db: Session = Depends(get_db)):
    existing = crud.get_plot_by_code(db, plot.plot_code)
    if existing:
        raise HTTPException(status_code=400, detail="地块编号已存在")
    return crud.create_plot(db, plot)


@app.put("/plots/{plot_id}", response_model=schemas.Plot)
def update_plot(plot_id: int, plot_update: schemas.PlotUpdate, db: Session = Depends(get_db)):
    updated = crud.update_plot(db, plot_id, plot_update)
    if not updated:
        raise HTTPException(status_code=404, detail="地块不存在")
    return updated


@app.get("/plots/{plot_id}/growth", response_model=List[schemas.GrowthRecord])
def list_plot_growth(plot_id: int, db: Session = Depends(get_db)):
    plot = crud.get_plot(db, plot_id)
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    return crud.get_growth_records(db, plot_id=plot_id)


@app.post("/growth", response_model=schemas.GrowthRecord)
def create_growth_record(gr: schemas.GrowthRecordCreate, db: Session = Depends(get_db)):
    plot = crud.get_plot(db, gr.plot_id)
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    return crud.create_growth_record(db, gr)


@app.put("/growth/{record_id}", response_model=schemas.GrowthRecord)
def update_growth_record(
    record_id: int, gr: schemas.GrowthRecordUpdate, db: Session = Depends(get_db)
):
    updated = crud.update_growth_record(db, record_id, gr)
    if not updated:
        raise HTTPException(status_code=404, detail="长势记录不存在")
    return updated


@app.delete("/growth/{record_id}")
def delete_growth_record(record_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_growth_record(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="长势记录不存在")
    return {"status": "ok"}


@app.get("/plots/{plot_id}/carbon", response_model=schemas.PlotCarbonDetail)
def get_plot_carbon(plot_id: int, db: Session = Depends(get_db)):
    result = crud.calc_plot_carbon(db, plot_id)
    if not result:
        raise HTTPException(status_code=404, detail="地块不存在")
    return result


@app.get("/carbon/all")
def get_all_carbon(db: Session = Depends(get_db)):
    return crud.calc_all_plots_carbon(db)


@app.get("/summary/by-farm", response_model=List[schemas.FarmSummaryItem])
def summary_by_farm(db: Session = Depends(get_db)):
    return crud.summarize_by_farm(db)


@app.get("/summary/by-species", response_model=List[schemas.SpeciesSummaryItem])
def summary_by_species(db: Session = Depends(get_db)):
    return crud.summarize_by_species(db)


@app.get("/researchers", response_model=List[schemas.Researcher])
def list_researchers(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return crud.get_researchers(db, skip=skip, limit=limit)


@app.get("/researchers/{researcher_id}", response_model=schemas.Researcher)
def get_researcher(researcher_id: int, db: Session = Depends(get_db)):
    r = crud.get_researcher(db, researcher_id)
    if not r:
        raise HTTPException(status_code=404, detail="科研人员不存在")
    return r


@app.post("/researchers", response_model=schemas.Researcher)
def create_researcher(r: schemas.ResearcherCreate, db: Session = Depends(get_db)):
    return crud.create_researcher(db, r)


@app.put("/researchers/{researcher_id}", response_model=schemas.Researcher)
def update_researcher(
    researcher_id: int, r: schemas.ResearcherUpdate, db: Session = Depends(get_db)
):
    updated = crud.update_researcher(db, researcher_id, r)
    if not updated:
        raise HTTPException(status_code=404, detail="科研人员不存在")
    return updated


@app.get("/stewardships")
def list_stewardships(
    plot_id: Optional[int] = Query(None),
    researcher_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.get_stewardships(db, plot_id=plot_id, researcher_id=researcher_id)


@app.post("/stewardships", response_model=schemas.StewardshipRecord)
def create_stewardship(sr: schemas.StewardshipRecordCreate, db: Session = Depends(get_db)):
    plot = crud.get_plot(db, sr.plot_id)
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    researcher = crud.get_researcher(db, sr.researcher_id)
    if not researcher:
        raise HTTPException(status_code=404, detail="科研人员不存在")
    if sr.end_year is not None and sr.start_year > sr.end_year:
        raise HTTPException(status_code=400, detail="开始年份不能大于结束年份")
    return crud.create_stewardship(db, sr)


@app.put("/stewardships/{sr_id}", response_model=schemas.StewardshipRecord)
def update_stewardship(
    sr_id: int, sr: schemas.StewardshipRecordUpdate, db: Session = Depends(get_db)
):
    updated = crud.update_stewardship(db, sr_id, sr)
    if not updated:
        raise HTTPException(status_code=404, detail="管护记录不存在")
    return updated


@app.delete("/stewardships/{sr_id}")
def delete_stewardship(sr_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_stewardship(db, sr_id)
    if not ok:
        raise HTTPException(status_code=404, detail="管护记录不存在")
    return {"status": "ok"}


@app.get("/plots/{plot_id}/stewardship-timeline", response_model=schemas.PlotStewardTimeline)
def get_steward_timeline(plot_id: int, db: Session = Depends(get_db)):
    result = crud.get_plot_steward_timeline(db, plot_id)
    if not result:
        raise HTTPException(status_code=404, detail="地块不存在")
    return result


@app.get("/species-params", response_model=List[schemas.CarbonSpeciesParams])
def list_species_params():
    return crud.get_species_params_list()


@app.get("/batches", response_model=List[schemas.CarbonCertificationBatch])
def list_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_batches(db, skip=skip, limit=limit)


@app.get("/batches/{batch_id}", response_model=schemas.CarbonCertificationBatchDetail)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = crud.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    memberships = crud.get_batch_memberships(db, batch_id)
    return {
        "id": batch.id,
        "batch_code": batch.batch_code,
        "batch_name": batch.batch_name,
        "start_year": batch.start_year,
        "end_year": batch.end_year,
        "description": batch.description,
        "total_carbon_sink_t": batch.total_carbon_sink_t,
        "total_area_hectare": batch.total_area_hectare,
        "plot_count": batch.plot_count,
        "created_at": batch.created_at,
        "updated_at": batch.updated_at,
        "memberships": memberships,
    }


@app.post("/batches", response_model=schemas.CarbonCertificationBatch)
def create_batch(batch: schemas.CarbonCertificationBatchCreate, db: Session = Depends(get_db)):
    existing = crud.get_batch_by_code(db, batch.batch_code)
    if existing:
        raise HTTPException(status_code=400, detail="批次编号已存在")
    if batch.start_year >= batch.end_year:
        raise HTTPException(status_code=400, detail="开始年份必须小于结束年份")
    return crud.create_batch(db, batch)


@app.put("/batches/{batch_id}", response_model=schemas.CarbonCertificationBatch)
def update_batch(
    batch_id: int,
    batch_update: schemas.CarbonCertificationBatchUpdate,
    db: Session = Depends(get_db),
):
    updated = crud.update_batch(db, batch_id, batch_update)
    if not updated:
        raise HTTPException(status_code=404, detail="批次不存在")
    return updated


@app.delete("/batches/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_batch(db, batch_id)
    if not ok:
        raise HTTPException(status_code=404, detail="批次不存在")
    return {"status": "ok"}


@app.get("/batches/{batch_id}/memberships")
def list_batch_memberships(batch_id: int, db: Session = Depends(get_db)):
    batch = crud.get_batch(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return crud.get_batch_memberships(db, batch_id)


@app.post("/batches/{batch_id}/plots")
def add_plots_to_batch(batch_id: int, data: schemas.AddPlotsToBatch, db: Session = Depends(get_db)):
    result = crud.add_plots_to_batch(db, batch_id, data.plot_ids)
    if not result:
        raise HTTPException(status_code=404, detail="批次不存在")
    batch, added_count = result
    return {"status": "ok", "added_count": added_count, "batch": batch}


@app.delete("/batches/{batch_id}/plots")
def remove_plots_from_batch(
    batch_id: int, data: schemas.RemovePlotsFromBatch, db: Session = Depends(get_db)
):
    result = crud.remove_plots_from_batch(db, batch_id, data.plot_ids)
    if not result:
        raise HTTPException(status_code=404, detail="批次不存在")
    batch, removed_count = result
    return {"status": "ok", "removed_count": removed_count, "batch": batch}
