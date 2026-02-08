from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.pipeline import Pipeline, PipelineStep
from app.models.template import Template
from app.schemas.pipeline import PipelineCreateRequest, PipelineUpdateRequest


class PipelineService:
    def __init__(self, db: Session):
        self.db = db

    def list_pipelines(self, skip: int = 0, limit: int = 50) -> tuple[list[Pipeline], int]:
        total = self.db.query(func.count(Pipeline.id)).scalar()

        pipelines = (
            self.db.query(Pipeline)
            .options(joinedload(Pipeline.steps).joinedload(PipelineStep.template))
            .offset(skip)
            .limit(limit)
            .all()
        )

        return pipelines, total

    def get_pipeline(self, pipeline_id: int) -> Pipeline | None:
        return (
            self.db.query(Pipeline)
            .options(joinedload(Pipeline.steps).joinedload(PipelineStep.template))
            .filter(Pipeline.id == pipeline_id)
            .first()
        )

    def create_pipeline(self, request: PipelineCreateRequest) -> Pipeline:
        self._validate_template_ids(request.steps)

        pipeline = Pipeline(name=request.name, description=request.description)
        self.db.add(pipeline)
        self.db.flush()

        for order, step_req in enumerate(request.steps, start=1):
            step = PipelineStep(
                pipeline_id=pipeline.id,
                step_order=order,
                template_id=step_req.template_id,
                provider=step_req.provider,
                model=step_req.model,
                output_variable=step_req.output_variable,
            )
            self.db.add(step)

        self.db.commit()
        return self.get_pipeline(pipeline.id)

    def update_pipeline(self, pipeline_id: int, request: PipelineUpdateRequest) -> Pipeline | None:
        pipeline = self.get_pipeline(pipeline_id)
        if not pipeline:
            return None

        if request.name is not None:
            pipeline.name = request.name
        if request.description is not None:
            pipeline.description = request.description

        if request.steps is not None:
            self._validate_template_ids(request.steps)
            self._replace_steps(pipeline, request.steps)

        self.db.commit()
        return self.get_pipeline(pipeline_id)

    def delete_pipeline(self, pipeline_id: int) -> bool:
        pipeline = self.db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
        if not pipeline:
            return False

        self.db.delete(pipeline)
        self.db.commit()
        return True

    def _validate_template_ids(self, steps) -> None:
        template_ids = {s.template_id for s in steps}
        existing_count = (
            self.db.query(func.count(Template.id))
            .filter(Template.id.in_(template_ids))
            .scalar()
        )
        if existing_count != len(template_ids):
            raise ValueError("One or more template IDs do not exist")

    def _replace_steps(self, pipeline: Pipeline, step_requests) -> None:
        for step in list(pipeline.steps):
            self.db.delete(step)
        self.db.flush()

        for order, step_req in enumerate(step_requests, start=1):
            step = PipelineStep(
                pipeline_id=pipeline.id,
                step_order=order,
                template_id=step_req.template_id,
                provider=step_req.provider,
                model=step_req.model,
                output_variable=step_req.output_variable,
            )
            self.db.add(step)
