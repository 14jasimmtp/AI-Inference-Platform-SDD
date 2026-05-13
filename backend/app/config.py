from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(..., env="DATABASE_URL")
    
    # Redis
    REDIS_URL: str = Field(..., env="REDIS_URL")
    REDIS_BUCKET_TTL_SECONDS: int = 120
    
    # Auth
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    
    # Inference
    OLLAMA_BASE_URL: str = Field(..., env="OLLAMA_BASE_URL")
    OLLAMA_DEFAULT_MODEL: str = "llama3.2:3b-instruct-q4_K_M"
    DEFAULT_RATE_LIMIT_RPM: int = 60
    
    # General
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:3000"
    PROMETHEUS_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
