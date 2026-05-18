import asyncio
import logging
import asyncpg
from sqlalchemy import text
from alembic.config import Config
from alembic import command
from app.config import settings
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

async def create_database_if_not_exists():
    """
    Connects to the default 'postgres' database and creates the target database if it doesn't exist.
    """
    url = urlparse(settings.DATABASE_URL)
    db_name = url.path.lstrip('/')
    
    # Create a connection string for the base 'postgres' database
    # e.g., postgresql+asyncpg://user:pass@host:port/postgres
    base_url = f"postgresql://{url.username}:{url.password}@{url.hostname}:{url.port}/postgres"
    
    try:
        conn = await asyncpg.connect(base_url)
        try:
            # Check if database exists
            exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = $1", db_name
            )
            
            if not exists:
                logger.info(f"Database '{db_name}' not found. Creating...")
                # CREATE DATABASE cannot be run inside a transaction block
                await conn.execute(f'CREATE DATABASE "{db_name}"')
                logger.info(f"Database '{db_name}' created successfully.")
            else:
                logger.debug(f"Database '{db_name}' already exists.")
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Error during database creation: {e}")
        # We don't raise here, as the DB might already exist and we just failed to check
        # The subsequent migration or app start will fail anyway if the DB is missing

import subprocess
import os
import sys

def run_migrations():
    """
    Runs alembic migrations via subprocess to avoid event loop conflicts.
    """
    logger.info("Running database migrations...")
    try:
        # Use the same python executable that is running this app
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        logger.info(f"Migrations applied successfully: {result.stdout}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error during migration: {e.stderr or e.stdout}")
        raise
    except Exception as e:
        logger.error(f"Failed to execute alembic command: {e}")
        raise

async def setup_db():
    """
    Main entry point for DB setup called during app startup.
    """
    await create_database_if_not_exists()
    # Migrations are typically sync-blocking calls (alembic)
    # Running in a threadpool to avoid blocking the event loop if necessary, 
    # but since it's startup it's usually fine.
    run_migrations()
    
    # Seed superuser
    try:
        from app.db.session import AsyncSessionLocal
        from app.models.user import User, UserRole
        from app.core.auth import get_password_hash
        import uuid
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            admin_email = "admin@platform.com"
            result = await db.execute(select(User).where(User.email == admin_email))
            if not result.scalar_one_or_none():
                user = User(
                    id=uuid.uuid4(),
                    email=admin_email,
                    full_name="System Administrator",
                    password_hash=get_password_hash("admin123"),
                    role=UserRole.super_admin,
                    is_active=True
                )
                db.add(user)
                await db.commit()
                logger.info(f"Seeded superuser: {admin_email}")
    except Exception as e:
        logger.error(f"Failed to seed superuser: {e}")
