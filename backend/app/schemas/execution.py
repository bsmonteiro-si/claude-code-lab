import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class ExecutionCreateRequest(BaseModel):
    template_id: int
    provider: str = Field(pattern=r"^(anthropic|openai)$")
    model: str
    variables: dict[str, str]


class ExecutionSchema(BaseModel):
    id: int
    template_id: int
    template_name: str
    template_version_id: int
    provider: str
    model: str
    variables: dict[str, str]
    status: str
    output: str | None
    error: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}

    @field_validator("variables", mode="before")
    @classmethod
    def parse_variables_json(cls, v: Any) -> dict[str, str]:
        if isinstance(v, str):
            return json.loads(v)
        return v


class ExecutionListResponse(BaseModel):
    executions: list[ExecutionSchema]
    total: int
