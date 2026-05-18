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
    
    # SMTP / Email Configuration
    SMTP_HOST: str = Field("mailpit", env="SMTP_HOST")
    SMTP_PORT: int = Field(1025, env="SMTP_PORT")
    SMTP_USERNAME: str = Field("", env="SMTP_USERNAME")
    SMTP_PASSWORD: str = Field("", env="SMTP_PASSWORD")
    SMTP_USE_TLS: bool = Field(False, env="SMTP_USE_TLS")
    SMTP_FROM_EMAIL: str = Field("no-reply@inference-platform.local", env="SMTP_FROM_EMAIL")
    FRONTEND_URL: str = Field("http://localhost:3000", env="FRONTEND_URL")
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = Field("", env="GOOGLE_CLIENT_ID")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
