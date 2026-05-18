import asyncio
import uuid
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.auth import get_password_hash

async def seed_superuser():
    async with AsyncSessionLocal() as db:
        admin_email = "admin@platform.com"
        from sqlalchemy import select
        result = await db.execute(
            select(User).where(User.email == admin_email)
        )
        if result.scalar_one_or_none():
            print(f"User {admin_email} already exists")
            return

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
        print(f"Created superuser: {admin_email} / admin123")

if __name__ == "__main__":
    asyncio.run(seed_superuser())
