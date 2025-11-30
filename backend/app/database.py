from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DB_TYPE = os.getenv("DB_TYPE", "sqlite")
DATABASE_URL = os.getenv("DATABASE_URL")

if DB_TYPE == "postgres":
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL must be set when using PostgreSQL")
    engine = create_engine(DATABASE_URL)
else:
    # SQLite
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./company_info.db")
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

