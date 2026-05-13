from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.api_key import ApiKeyCreateRequest, ApiKeyResponse, ApiKeyCreatedResponse
from app.schemas.base import ok
from app.services.api_key_service import ApiKeyService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api-keys", tags=["api-keys"])

@router.post("", response_model=dict, status_code=201)
async def create_key(
    body: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ApiKeyService(db)
    api_key, raw_key = await svc.create_key(str(current_user.id), body)
    response = ApiKeyCreatedResponse(
        **ApiKeyResponse.model_validate(api_key).model_dump(),
        plaintext_key=raw_key,
    )
    return ok(response.model_dump())

@router.get("", response_model=dict)
async def list_keys(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ApiKeyService(db)
    keys = await svc.list_keys(str(current_user.id))
    return ok([ApiKeyResponse.model_validate(k).model_dump() for k in keys])

@router.delete("/{key_id}", status_code=204)
async def revoke_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = ApiKeyService(db)
    await svc.revoke_key(key_id, str(current_user.id))
