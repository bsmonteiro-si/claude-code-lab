from openai import OpenAI

from app.core.config import settings
from app.engine.providers.base import LLMProvider


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def execute(self, prompt: str, model: str) -> str:
        response = self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content

    def list_models(self) -> list[str]:
        return ["gpt-4o", "gpt-4o-mini"]
