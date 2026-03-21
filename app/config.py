from pydantic_settings import BaseSettings
from pydantic import Extra

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    class Config:
        env_file = ".env"
        extra = Extra.ignore



settings = Settings()
