from datetime import datetime

from pydantic import BaseModel, Field


class TemplateVersionSchema(BaseModel):
    id: int
    version_number: int
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TemplateSchema(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime | None
    latest_version: TemplateVersionSchema | None = None

    model_config = {"from_attributes": True}


class TemplateCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    content: str = Field(min_length=1)


class TemplateUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    content: str | None = Field(default=None, min_length=1)


class TemplateListResponse(BaseModel):
    templates: list[TemplateSchema]
    total: int
