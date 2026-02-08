from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    def execute(self, prompt: str, model: str) -> str:
        pass

    @abstractmethod
    def list_models(self) -> list[str]:
        pass
