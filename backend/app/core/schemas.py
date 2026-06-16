from typing import Any, Optional, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class BaseResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
    meta: Optional[dict] = None

def ok(data: Any, meta: Optional[dict] = None) -> dict:
    resp = {"success": True, "data": data}
    if meta:
        resp["meta"] = meta
    return resp

def error_response(code: str, message: str, details: Any = None) -> dict:
    resp = {
        "success": False, 
        "error": {
            "code": code, 
            "message": message
        }
    }
    if details:
        resp["error"]["details"] = details
    return resp
