from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.template import (
    TemplateCreateRequest,
    TemplateListResponse,
    TemplateSchema,
    TemplateUpdateRequest,
    TemplateVersionSchema,
)
from app.services.template_service import TemplateService

router = APIRouter(prefix="/templates", tags=["templates"])


def _get_service(db: Session = Depends(get_db)) -> TemplateService:
    return TemplateService(db)


@router.get("/", response_model=TemplateListResponse)
def list_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: TemplateService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    templates, total = service.list_templates(user_id=current_user.id, skip=skip, limit=limit)
    return TemplateListResponse(templates=templates, total=total)


@router.post("/", response_model=TemplateSchema, status_code=201)
def create_template(
    request: TemplateCreateRequest,
    service: TemplateService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    return service.create_template(request, user_id=current_user.id)


@router.get("/{template_id}", response_model=TemplateSchema)
def get_template(
    template_id: int,
    service: TemplateService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    template = service.get_template(template_id, user_id=current_user.id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=TemplateSchema)
def update_template(
    template_id: int,
    request: TemplateUpdateRequest,
    service: TemplateService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    template = service.update_template(template_id, request, user_id=current_user.id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    service: TemplateService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    deleted = service.delete_template(template_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Template not found")


@router.get("/{template_id}/versions", response_model=list[TemplateVersionSchema])
def get_template_versions(
    template_id: int,
    service: TemplateService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    return service.get_template_versions(template_id, user_id=current_user.id)
