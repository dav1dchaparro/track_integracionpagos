from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


class Database:

    def __init__(self, session: Session) -> None:
        self._session = session

    @classmethod
    def for_production(cls, database_url: str) -> "Database":
        engine = create_engine(database_url)
        Base.metadata.create_all(engine)
        factory = sessionmaker(bind=engine)
        session = factory()
        db = cls(session)
        db._engine = engine
        db._factory = factory
        return db

    @classmethod
    def for_testing(cls, database_url: str) -> "Database":
        engine = create_engine(database_url)
        with engine.connect() as conn:
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.commit()
        Base.metadata.create_all(engine)
        connection = engine.connect()
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint")
        db = cls(session)
        db._engine = engine
        db._connection = connection
        db._transaction = transaction
        return db

    @property
    def session(self) -> Session:
        return self._session

    def cleanup(self) -> None:
        self._session.close()
        if hasattr(self, "_transaction"):
            self._transaction.rollback()
            self._connection.close()
        if hasattr(self, "_engine"):
            self._engine.dispose()


_database: Database | None = None


def init_db(database: Database) -> None:
    global _database
    _database = database


def get_db() -> Session:
    assert _database is not None, "Call init_db() first"
    yield _database.session
