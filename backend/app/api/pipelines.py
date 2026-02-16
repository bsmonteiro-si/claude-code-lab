from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.engine.pipeline_executor import PipelineExecutor
from app.models.pipeline import Pipeline, PipelineExecution
from app.models.user import User
from app.schemas.pipeline import (
    PipelineCreateRequest,
    PipelineExecuteRequest,
    PipelineExecutionListResponse,
    PipelineExecutionSchema,
    PipelineListResponse,
    PipelineSchema,
    PipelineStepSchema,
    PipelineUpdateRequest,
)
from app.services.pipeline_service import PipelineService

router = APIRouter(prefix="/pipelines", tags=["pipelines"])
executions_router = APIRouter(prefix="/pipeline-executions", tags=["pipeline-executions"])


def _get_service(db: Session = Depends(get_db)) -> PipelineService:
    return PipelineService(db)


def _to_pipeline_schema(pipeline) -> PipelineSchema:
    steps = [
        PipelineStepSchema(
            id=s.id,
            step_order=s.step_order,
            template_id=s.template_id,
            template_name=s.template.name,
            provider=s.provider,
            model=s.model,
            output_variable=s.output_variable,
        )
        for s in pipeline.steps
    ]
    return PipelineSchema(
        id=pipeline.id,
        name=pipeline.name,
        description=pipeline.description,
        steps=steps,
        created_at=pipeline.created_at,
        updated_at=pipeline.updated_at,
    )


def _enrich_pipeline_execution(execution: PipelineExecution) -> PipelineExecution:
    execution.pipeline_name = (
        execution.pipeline.name if execution.pipeline else "[Deleted Pipeline]"
    )
    return execution


@router.get("/", response_model=PipelineListResponse)
def list_pipelines(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    service: PipelineService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    pipelines, total = service.list_pipelines(user_id=current_user.id, skip=skip, limit=limit)
    return PipelineListResponse(
        pipelines=[_to_pipeline_schema(p) for p in pipelines],
        total=total,
    )


@router.post("/", response_model=PipelineSchema, status_code=201)
def create_pipeline(
    request: PipelineCreateRequest,
    service: PipelineService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    try:
        pipeline = service.create_pipeline(request, user_id=current_user.id)
        return _to_pipeline_schema(pipeline)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{pipeline_id}", response_model=PipelineSchema)
def get_pipeline(
    pipeline_id: int,
    service: PipelineService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    pipeline = service.get_pipeline(pipeline_id, user_id=current_user.id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return _to_pipeline_schema(pipeline)


@router.put("/{pipeline_id}", response_model=PipelineSchema)
def update_pipeline(
    pipeline_id: int,
    request: PipelineUpdateRequest,
    service: PipelineService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    try:
        pipeline = service.update_pipeline(pipeline_id, request, user_id=current_user.id)
        if not pipeline:
            raise HTTPException(status_code=404, detail="Pipeline not found")
        return _to_pipeline_schema(pipeline)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{pipeline_id}", status_code=204)
def delete_pipeline(
    pipeline_id: int,
    service: PipelineService = Depends(_get_service),
    current_user: User = Depends(get_current_user),
):
    deleted = service.delete_pipeline(pipeline_id, user_id=current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pipeline not found")


@router.post("/{pipeline_id}/execute", response_model=PipelineExecutionSchema, status_code=201)
def execute_pipeline(
    pipeline_id: int,
    request: PipelineExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        executor = PipelineExecutor(db)
        execution = executor.execute(pipeline_id, request.variables, user_id=current_user.id)
        return _enrich_pipeline_execution(execution)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{pipeline_id}/executions", response_model=PipelineExecutionListResponse)
def list_pipeline_executions(
    pipeline_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pipeline = (
        db.query(Pipeline)
        .filter(Pipeline.id == pipeline_id, Pipeline.user_id == current_user.id)
        .first()
    )
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")

    total = (
        db.query(func.count(PipelineExecution.id))
        .filter(PipelineExecution.pipeline_id == pipeline_id)
        .scalar()
    )

    executions = (
        db.query(PipelineExecution)
        .options(joinedload(PipelineExecution.pipeline))
        .filter(PipelineExecution.pipeline_id == pipeline_id)
        .order_by(PipelineExecution.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    for execution in executions:
        _enrich_pipeline_execution(execution)

    return PipelineExecutionListResponse(executions=executions, total=total)


@executions_router.get("/", response_model=PipelineExecutionListResponse)
def list_all_pipeline_executions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = (
        db.query(func.count(PipelineExecution.id))
        .join(Pipeline, PipelineExecution.pipeline_id == Pipeline.id)
        .filter(Pipeline.user_id == current_user.id)
        .scalar()
    )

    executions = (
        db.query(PipelineExecution)
        .join(Pipeline, PipelineExecution.pipeline_id == Pipeline.id)
        .options(joinedload(PipelineExecution.pipeline))
        .filter(Pipeline.user_id == current_user.id)
        .order_by(PipelineExecution.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    for execution in executions:
        _enrich_pipeline_execution(execution)

    return PipelineExecutionListResponse(executions=executions, total=total)
