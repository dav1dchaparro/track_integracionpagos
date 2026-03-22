from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Clover
    clover_merchant_id: str = ""
    clover_access_token: str = ""
    clover_api_base_url: str = "https://api.clover.com"

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()
