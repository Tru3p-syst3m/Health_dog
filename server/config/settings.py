from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "DefaultApp"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    FOOD_DATABASE_URL: str = "sqlite:///./allfood.db"

settings = Settings()