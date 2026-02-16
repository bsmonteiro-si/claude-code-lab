from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./prompt_lab.db"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_EXPIRATION_MINUTES: int = 1440

    model_config = {"env_file": ".env"}


settings = Settings()
