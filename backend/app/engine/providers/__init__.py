from app.engine.providers.anthropic_provider import AnthropicProvider
from app.engine.providers.base import LLMProvider
from app.engine.providers.openai_provider import OpenAIProvider

PROVIDER_MAP: dict[str, type[LLMProvider]] = {
    "anthropic": AnthropicProvider,
    "openai": OpenAIProvider,
}


def get_provider(name: str) -> LLMProvider:
    provider_class = PROVIDER_MAP.get(name)
    if not provider_class:
        raise ValueError(f"Unknown provider: {name}")
    return provider_class()
