from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.execution import ExecutionStatus


class Pipeline(Base):
    __tablename__ = "pipelines"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now()
    )

    steps: Mapped[list["PipelineStep"]] = relationship(
        back_populates="pipeline",
        cascade="all, delete-orphan",
        order_by="PipelineStep.step_order",
    )


class PipelineStep(Base):
    __tablename__ = "pipeline_steps"

    id: Mapped[int] = mapped_column(primary_key=True)
    pipeline_id: Mapped[int] = mapped_column(
        ForeignKey("pipelines.id", ondelete="CASCADE"), nullable=False
    )
    step_order: Mapped[int] = mapped_column(nullable=False)
    template_id: Mapped[int] = mapped_column(
        ForeignKey("templates.id"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    output_variable: Mapped[str] = mapped_column(String(100), nullable=False)

    pipeline: Mapped["Pipeline"] = relationship(back_populates="steps")
    template: Mapped["Template"] = relationship()

    __table_args__ = (
        Index("uq_pipeline_step_order", "pipeline_id", "step_order", unique=True),
    )


class PipelineExecution(Base):
    __tablename__ = "pipeline_executions"

    id: Mapped[int] = mapped_column(primary_key=True)
    pipeline_id: Mapped[int] = mapped_column(
        ForeignKey("pipelines.id"), nullable=False
    )
    status: Mapped[ExecutionStatus] = mapped_column(default=ExecutionStatus.PENDING)
    variables: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    pipeline: Mapped["Pipeline"] = relationship()

    step_executions: Mapped[list["PipelineStepExecution"]] = relationship(
        back_populates="pipeline_execution",
        cascade="all, delete-orphan",
        order_by="PipelineStepExecution.step_order",
    )


class PipelineStepExecution(Base):
    __tablename__ = "pipeline_step_executions"

    id: Mapped[int] = mapped_column(primary_key=True)
    pipeline_execution_id: Mapped[int] = mapped_column(
        ForeignKey("pipeline_executions.id", ondelete="CASCADE"), nullable=False
    )
    pipeline_step_id: Mapped[int] = mapped_column(
        ForeignKey("pipeline_steps.id"), nullable=False
    )
    step_order: Mapped[int] = mapped_column(nullable=False)
    input_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    output: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ExecutionStatus] = mapped_column(default=ExecutionStatus.PENDING)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    pipeline_execution: Mapped["PipelineExecution"] = relationship(
        back_populates="step_executions"
    )


from app.models.template import Template  # noqa: E402
