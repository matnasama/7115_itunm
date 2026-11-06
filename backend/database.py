import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv(Path(__file__).resolve().parent.parent / '.env')


class Base(DeclarativeBase):
    pass


@lru_cache(maxsize=1)
def get_engine():
    url = os.getenv('DATABASE_URL')
    if not url:
        raise RuntimeError('Configurá DATABASE_URL en .env (ver .env.example)')
    if url.startswith('postgresql://'):
        url = url.replace('postgresql://', 'postgresql+psycopg://', 1)
    return create_engine(url, pool_pre_ping=True)


SessionLocal = sessionmaker()


def get_db():
    with SessionLocal(bind=get_engine()) as session:
        yield session
