import os
from datetime import date, datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DEFAULT_DB_URL = "sqlite:///./data/carbon_forest.db"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    db_path = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "", 1)
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ForestFarm(Base):
    __tablename__ = "forest_farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    location = Column(String(500))
    region = Column(String(200))
    established_year = Column(Integer)
    description = Column(Text)

    plots = relationship("Plot", back_populates="farm", cascade="all, delete-orphan")


class Plot(Base):
    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("forest_farms.id"), nullable=False)
    plot_code = Column(String(100), unique=True, nullable=False, index=True)
    plot_name = Column(String(200), nullable=False)
    tree_species = Column(String(200), nullable=False)
    planting_year = Column(Integer, nullable=False)
    area_hectare = Column(Float, nullable=False)
    elevation = Column(Float)
    soil_type = Column(String(200))
    initial_density = Column(Integer)
    notes = Column(Text)

    farm = relationship("ForestFarm", back_populates="plots")
    growth_records = relationship(
        "GrowthRecord",
        back_populates="plot",
        cascade="all, delete-orphan",
        order_by="GrowthRecord.record_year",
    )
    stewardships = relationship(
        "StewardshipRecord", back_populates="plot", cascade="all, delete-orphan"
    )
    batch_memberships = relationship(
        "BatchPlotMembership", back_populates="plot", cascade="all, delete-orphan"
    )


class GrowthRecord(Base):
    __tablename__ = "growth_records"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    record_year = Column(Integer, nullable=False)
    mean_height_m = Column(Float)
    mean_dbh_cm = Column(Float)
    volume_per_ha_m3 = Column(Float, nullable=False)
    mortality_rate = Column(Float, default=0.0)
    survey_date = Column(Date, default=date.today)
    survey_method = Column(String(200))
    surveyors = Column(String(500))
    remarks = Column(Text)

    plot = relationship("Plot", back_populates="growth_records")


class Researcher(Base):
    __tablename__ = "researchers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    gender = Column(String(10))
    birth_year = Column(Integer)
    title = Column(String(200))
    institution = Column(String(500))
    specialty = Column(String(500))
    join_year = Column(Integer)
    phone = Column(String(50))
    email = Column(String(200))
    bio = Column(Text)
    avatar_color = Column(String(20), default="#4f7942")

    stewardships = relationship(
        "StewardshipRecord", back_populates="researcher", cascade="all, delete-orphan"
    )


class StewardshipRecord(Base):
    __tablename__ = "stewardship_records"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    researcher_id = Column(Integer, ForeignKey("researchers.id"), nullable=False)
    start_year = Column(Integer, nullable=False)
    end_year = Column(Integer)
    role = Column(String(200))
    breeding_work = Column(Text)
    management_work = Column(Text)
    key_achievements = Column(Text)
    handover_notes = Column(Text)

    plot = relationship("Plot", back_populates="stewardships")
    researcher = relationship("Researcher", back_populates="stewardships")


class CarbonCertificationBatch(Base):
    __tablename__ = "carbon_certification_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_code = Column(String(100), unique=True, nullable=False, index=True)
    batch_name = Column(String(200), nullable=False)
    start_year = Column(Integer, nullable=False)
    end_year = Column(Integer, nullable=False)
    description = Column(Text)
    total_carbon_sink_t = Column(Float, default=0.0)
    total_area_hectare = Column(Float, default=0.0)
    plot_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    memberships = relationship(
        "BatchPlotMembership", back_populates="batch", cascade="all, delete-orphan"
    )


class BatchPlotMembership(Base):
    __tablename__ = "batch_plot_memberships"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(
        Integer, ForeignKey("carbon_certification_batches.id"), nullable=False, index=True
    )
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False, index=True)
    carbon_sink_t = Column(Float, default=0.0)
    carbon_stock_start_t = Column(Float, default=0.0)
    carbon_stock_end_t = Column(Float, default=0.0)
    area_hectare = Column(Float, default=0.0)
    added_at = Column(DateTime, default=datetime.utcnow)

    batch = relationship("CarbonCertificationBatch", back_populates="memberships")
    plot = relationship("Plot", back_populates="batch_memberships")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
