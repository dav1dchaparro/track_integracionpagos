from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Clover integration
    clover_api_base: str = "https://apisandbox.dev.clover.com"
    clover_app_id: str = ""
    clover_app_secret: str = ""

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()
