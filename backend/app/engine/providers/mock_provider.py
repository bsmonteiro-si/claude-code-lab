from app.engine.providers.base import LLMProvider


class MockProvider(LLMProvider):
    def execute(self, prompt: str, model: str) -> str:
        return f"Mock response for: {prompt[:100]}"

    def list_models(self) -> list[str]:
        return ["mock-model"]
