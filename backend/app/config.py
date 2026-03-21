from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./smartreceipt.db"
    CLOVER_APP_ID: str = ""
    CLOVER_APP_SECRET: str = ""
    CLOVER_API_BASE_URL: str = "https://api.clover.com"
    OPENAI_API_KEY: str = ""  # Opcional: para insights con GPT
    SECRET_KEY: str = "smartreceipt-secret-key-change-in-prod"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
