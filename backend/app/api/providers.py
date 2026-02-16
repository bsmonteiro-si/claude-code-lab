from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.engine.providers import get_provider
from app.models.user import User

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/")
def list_providers(current_user: User = Depends(get_current_user)):
    provider_names = ["anthropic", "openai"]
    return {
        "providers": [
            {"name": name, "models": get_provider(name).list_models()}
            for name in provider_names
        ]
    }
