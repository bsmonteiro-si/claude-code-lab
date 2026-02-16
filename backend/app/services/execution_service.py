import json
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.engine.providers import get_provider
from app.engine.variable_substitution import substitute_variables
from app.models.execution import Execution, ExecutionStatus
from app.models.template import Template
from app.schemas.execution import ExecutionCreateRequest
from app.services.template_service import TemplateService


class ExecutionService:
    def __init__(self, db: Session):
        self.db = db

    def execute_template(self, request: ExecutionCreateRequest, user_id: int) -> Execution:
        template = TemplateService(self.db).get_template(request.template_id, user_id)
        if not template:
            raise ValueError("Template not found")

        latest_version = template.latest_version

        execution = Execution(
            template_id=template.id,
            template_version_id=latest_version.id,
            provider=request.provider,
            model=request.model,
            variables=json.dumps(request.variables),
            status=ExecutionStatus.RUNNING,
        )
        self.db.add(execution)
        self.db.flush()

        try:
            resolved_prompt = substitute_variables(latest_version.content, request.variables)
            provider = get_provider(request.provider)
            output = provider.execute(resolved_prompt, request.model)
            execution.output = output
            execution.status = ExecutionStatus.COMPLETED
            execution.completed_at = datetime.now(timezone.utc)
        except Exception as e:
            execution.error = str(e)
            execution.status = ExecutionStatus.FAILED
            execution.completed_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(execution)
        execution.template_name = template.name
        return execution

    def list_executions(self, user_id: int, skip: int = 0, limit: int = 50) -> tuple[list[Execution], int]:
        total = (
            self.db.query(func.count(Execution.id))
            .join(Template, Execution.template_id == Template.id)
            .filter(Template.user_id == user_id)
            .scalar()
        )

        executions = (
            self.db.query(Execution)
            .join(Template, Execution.template_id == Template.id)
            .options(joinedload(Execution.template))
            .filter(Template.user_id == user_id)
            .order_by(Execution.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        for execution in executions:
            execution.template_name = execution.template.name

        return executions, total

    def get_execution(self, execution_id: int, user_id: int) -> Execution | None:
        execution = (
            self.db.query(Execution)
            .join(Template, Execution.template_id == Template.id)
            .options(joinedload(Execution.template))
            .filter(Execution.id == execution_id, Template.user_id == user_id)
            .first()
        )

        if execution:
            execution.template_name = execution.template.name

        return execution
