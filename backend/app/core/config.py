from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./prompt_lab.db"
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
