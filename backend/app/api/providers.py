from fastapi import APIRouter

from app.engine.providers import get_provider

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/")
def list_providers():
    provider_names = ["anthropic", "openai"]
    return {
        "providers": [
            {"name": name, "models": get_provider(name).list_models()}
            for name in provider_names
        ]
    }
