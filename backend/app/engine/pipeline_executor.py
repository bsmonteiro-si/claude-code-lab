import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.engine.providers import get_provider
from app.engine.variable_substitution import substitute_variables
from app.models.execution import ExecutionStatus
from app.models.pipeline import PipelineExecution, PipelineStepExecution
from app.services.pipeline_service import PipelineService
from app.services.template_service import TemplateService


class PipelineExecutor:
    def __init__(self, db: Session):
        self.db = db

    def execute(self, pipeline_id: int, variables: dict[str, str], user_id: int) -> PipelineExecution:
        pipeline = PipelineService(self.db).get_pipeline(pipeline_id, user_id)
        if not pipeline:
            raise ValueError("Pipeline not found")

        pipeline_execution = self._create_execution_record(pipeline_id, variables)
        context = dict(variables)

        for step in pipeline.steps:
            step_execution = self._create_step_execution(pipeline_execution, step, context, user_id)

            try:
                output = self._execute_step(step, context, user_id)
                self._mark_step_completed(step_execution, output)
                context[step.output_variable] = output
            except Exception as e:
                self._mark_step_failed(step_execution, str(e))
                self._mark_execution_failed(pipeline_execution)
                return pipeline_execution

        self._mark_execution_completed(pipeline_execution)
        return pipeline_execution

    def _create_execution_record(self, pipeline_id: int, variables: dict[str, str]) -> PipelineExecution:
        execution = PipelineExecution(
            pipeline_id=pipeline_id,
            status=ExecutionStatus.RUNNING,
            variables=json.dumps(variables),
        )
        self.db.add(execution)
        self.db.flush()
        return execution

    def _create_step_execution(self, pipeline_execution, step, context, user_id: int) -> PipelineStepExecution:
        template = TemplateService(self.db).get_template(step.template_id, user_id)
        latest_version = template.latest_version
        input_prompt = substitute_variables(latest_version.content, context)

        step_execution = PipelineStepExecution(
            pipeline_execution_id=pipeline_execution.id,
            pipeline_step_id=step.id,
            step_order=step.step_order,
            input_prompt=input_prompt,
            status=ExecutionStatus.RUNNING,
        )
        self.db.add(step_execution)
        self.db.flush()
        return step_execution

    def _execute_step(self, step, context, user_id: int) -> str:
        template = TemplateService(self.db).get_template(step.template_id, user_id)
        latest_version = template.latest_version
        resolved_prompt = substitute_variables(latest_version.content, context)
        provider = get_provider(step.provider)
        return provider.execute(resolved_prompt, step.model)

    def _mark_step_completed(self, step_execution: PipelineStepExecution, output: str) -> None:
        step_execution.output = output
        step_execution.status = ExecutionStatus.COMPLETED
        step_execution.completed_at = datetime.now(timezone.utc)
        self.db.flush()

    def _mark_step_failed(self, step_execution: PipelineStepExecution, error: str) -> None:
        step_execution.error = error
        step_execution.status = ExecutionStatus.FAILED
        step_execution.completed_at = datetime.now(timezone.utc)
        self.db.flush()

    def _mark_execution_completed(self, execution: PipelineExecution) -> None:
        execution.status = ExecutionStatus.COMPLETED
        execution.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(execution)

    def _mark_execution_failed(self, execution: PipelineExecution) -> None:
        execution.status = ExecutionStatus.FAILED
        execution.completed_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(execution)
