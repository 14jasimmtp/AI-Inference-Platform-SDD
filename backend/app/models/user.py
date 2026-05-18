import uuid
import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, UUID, Enum, DateTime
import enum
from app.models.base import Base, TimestampMixin

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    org_admin = "org_admin"
    team_lead = "team_lead"
    user = "user"

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(320), unique=True, index=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), nullable=False, default=UserRole.user
    )
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_token: Mapped[str] = mapped_column(String(255), nullable=True)
    verification_sent_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    reset_token: Mapped[str] = mapped_column(String(255), nullable=True)
    reset_expires_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    google_sso_id: Mapped[str] = mapped_column(String(255), nullable=True)
    
    def __repr__(self):
        return f"<User {self.email}>"
