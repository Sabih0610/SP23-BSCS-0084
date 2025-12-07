# api\app\config.py
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "local"
    log_level: str = "INFO"

    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str
    supabase_jwt_secret: str | None = None
    disable_role_checks_local: bool = True

    gemini_api_key: str

    class Config:
        env_file = ".env"
        env_prefix = ""
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
