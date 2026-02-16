from app.core.config import settings
from app.engine.providers.anthropic_provider import AnthropicProvider
from app.engine.providers.base import LLMProvider
from app.engine.providers.mock_provider import MockProvider
from app.engine.providers.openai_provider import OpenAIProvider

PROVIDER_MAP: dict[str, type[LLMProvider]] = {
    "anthropic": AnthropicProvider,
    "openai": OpenAIProvider,
    "mock": MockProvider,
}


def _is_test_env() -> bool:
    return settings.APP_ENV == "test"


def get_provider(name: str) -> LLMProvider:
    if _is_test_env():
        return MockProvider()
    provider_class = PROVIDER_MAP.get(name)
    if not provider_class:
        raise ValueError(f"Unknown provider: {name}")
    return provider_class()
