import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class PipelineStepCreateRequest(BaseModel):
    template_id: int
    provider: str = Field(pattern=r"^(anthropic|openai)$")
    model: str
    output_variable: str = Field(min_length=1, max_length=100)


class PipelineCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    steps: list[PipelineStepCreateRequest] = Field(min_length=1)


class PipelineUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    steps: list[PipelineStepCreateRequest] | None = Field(default=None, min_length=1)


class PipelineStepSchema(BaseModel):
    id: int
    step_order: int
    template_id: int
    template_name: str
    provider: str
    model: str
    output_variable: str


class PipelineSchema(BaseModel):
    id: int
    name: str
    description: str | None
    steps: list[PipelineStepSchema]
    created_at: datetime
    updated_at: datetime | None


class PipelineListResponse(BaseModel):
    pipelines: list[PipelineSchema]
    total: int


class PipelineExecuteRequest(BaseModel):
    variables: dict[str, str]


class PipelineStepExecutionSchema(BaseModel):
    id: int
    step_order: int
    input_prompt: str
    output: str | None
    status: str
    error: str | None

    model_config = {"from_attributes": True}


class PipelineExecutionSchema(BaseModel):
    id: int
    pipeline_id: int
    pipeline_name: str
    status: str
    variables: dict[str, str]
    step_executions: list[PipelineStepExecutionSchema]
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}

    @field_validator("variables", mode="before")
    @classmethod
    def parse_variables_json(cls, v: Any) -> dict[str, str]:
        if isinstance(v, str):
            return json.loads(v)
        return v


class PipelineExecutionListResponse(BaseModel):
    executions: list[PipelineExecutionSchema]
    total: int
