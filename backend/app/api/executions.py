from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.execution import (
    ExecutionCreateRequest,
    ExecutionListResponse,
    ExecutionSchema,
)
from app.services.execution_service import ExecutionService

router = APIRouter(prefix="/executions", tags=["executions"])


def _get_service(db: Session = Depends(get_db)) -> ExecutionService:
    return ExecutionService(db)


@router.post("/", response_model=ExecutionSchema, status_code=201)
def execute_template(
    request: ExecutionCreateRequest,
    service: ExecutionService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.execute_template(request, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=ExecutionListResponse)
def list_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: ExecutionService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    executions, total = service.list_executions(user_id=current_user.id, skip=skip, limit=limit)
    return ExecutionListResponse(executions=executions, total=total)


@router.get("/{execution_id}", response_model=ExecutionSchema)
def get_execution(
    execution_id: int,
    service: ExecutionService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    execution = service.get_execution(execution_id, user_id=current_user.id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution
