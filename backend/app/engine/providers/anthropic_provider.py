from anthropic import Anthropic

from app.core.config import settings
from app.engine.providers.base import LLMProvider


class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def execute(self, prompt: str, model: str) -> str:
        message = self.client.messages.create(
            model=model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

    def list_models(self) -> list[str]:
        return ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"]
