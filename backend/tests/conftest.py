"""Pytest fixtures.

Tests run against a dedicated `<database>_test` database on the same Postgres
server the app is configured for. The schema is built from the models with
`create_all` (the Postgres ENUM types come along for free); every test runs inside
a transaction that is rolled back afterward, so rows never accrete.
"""

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.cli import DEFAULT_SHIPPING_ZONES
from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models import Admin, Availability, Product, ShippingZone

_TEST_DB = "nankara_test"


def _test_database_url() -> str:
    url = settings.database_url
    base, _, _current = url.rpartition("/")
    return f"{base}/{_TEST_DB}"


def _ensure_test_database() -> None:
    admin_url = settings.database_url.rpartition("/")[0] + "/postgres"
    dsn = admin_url.replace("postgresql+psycopg://", "postgresql://")
    with psycopg.connect(dsn, autocommit=True) as conn:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (_TEST_DB,)
        ).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{_TEST_DB}"')


@pytest.fixture(scope="session")
def engine():
    _ensure_test_database()
    eng = create_engine(_test_database_url(), future=True)
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    Base.metadata.drop_all(eng)
    eng.dispose()


@pytest.fixture()
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection, autoflush=False, future=True)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin(db) -> Admin:
    record = Admin(
        email="admin@nankara.test", password_hash=hash_password("test-password")
    )
    db.add(record)
    db.flush()
    return record


@pytest.fixture()
def admin_token(admin) -> str:
    return create_access_token(str(admin.id))


@pytest.fixture()
def auth_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture()
def seeded_zones(db) -> list[ShippingZone]:
    zones = [
        ShippingZone(code=code, name=name, region_type=region_type, rate=rate)
        for code, name, region_type, rate in DEFAULT_SHIPPING_ZONES
    ]
    db.add_all(zones)
    db.flush()
    return zones


@pytest.fixture()
def make_product(db):
    counter = {"n": 0}

    def _make(
        *,
        name: str | None = None,
        price_ngn: int = 100000,
        is_published: bool = True,
        availability: Availability = Availability.IN_STOCK,
    ) -> Product:
        counter["n"] += 1
        n = counter["n"]
        product = Product(
            name=name or f"Test Piece {n}",
            slug=f"test-piece-{n}",
            description="A test piece.",
            price_ngn=price_ngn,
            is_published=is_published,
            availability=availability,
        )
        db.add(product)
        db.flush()
        return product

    return _make
