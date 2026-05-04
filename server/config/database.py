from sqlmodel import SQLModel, create_engine, Session
from config.settings import settings
# ==========FOOD_DB==========
food_db_engine = create_engine(
    settings.FOOD_DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False},  # только для SQLite
)

def food_db_create():
    SQLModel.metadata.create_all(food_db_engine)


def food_db_get_session():
    with Session(food_db_engine) as session:
        yield session