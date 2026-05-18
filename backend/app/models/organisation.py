"""SQLAlchemy ORM model for the organisations table."""
import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, UUID
from app.models.base import Base, TimestampMixin


class Organisation(Base, TimestampMixin):
    __tablename__ = "organisations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def __repr__(self):
        return f"<Organisation {self.slug}>"
