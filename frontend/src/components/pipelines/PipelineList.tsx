import type { Pipeline } from "../../types/pipeline";

interface PipelineListProps {
  pipelines: Pipeline[];
  isLoading: boolean;
  onEdit: (pipeline: Pipeline) => void;
  onDelete: (pipeline: Pipeline) => void;
  onExecute: (pipeline: Pipeline) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

function PipelineCard({
  pipeline,
  onEdit,
  onDelete,
  onExecute,
}: {
  pipeline: Pipeline;
  onEdit: () => void;
  onDelete: () => void;
  onExecute: () => void;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-text-primary">{pipeline.name}</h3>
        <div className="flex gap-2">
          <button
            onClick={onExecute}
            className="px-3 py-1 text-sm btn-glass-execute"
          >
            Execute
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm btn-glass-primary"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm btn-glass-danger"
          >
            Delete
          </button>
        </div>
      </div>
      {pipeline.description && (
        <p className="mt-2 text-text-secondary">{pipeline.description}</p>
      )}
      <div className="mt-3 space-y-1">
        {pipeline.steps.map((step) => (
          <div
            key={step.id}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            <span className="font-mono text-xs bg-glass-bg-active px-2 py-0.5 rounded-md text-text-secondary">
              {step.step_order}
            </span>
            <span>{step.template_name}</span>
            <span className="text-text-tertiary">&rarr;</span>
            <span className="font-mono text-xs text-accent-primary">
              {`{{${step.output_variable}}}`}
            </span>
            <span className="text-xs text-text-tertiary">
              ({step.provider}/{step.model})
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-text-tertiary">
        <span>{pipeline.steps.length} step(s)</span>
        <span>{formatDate(pipeline.created_at)}</span>
      </div>
    </div>
  );
}

export default function PipelineList({
  pipelines,
  isLoading,
  onEdit,
  onDelete,
  onExecute,
}: PipelineListProps) {
  if (isLoading) {
    return <p className="text-text-tertiary">Loading pipelines...</p>;
  }

  if (pipelines.length === 0) {
    return <p className="text-text-tertiary">No pipelines yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {pipelines.map((pipeline) => (
        <PipelineCard
          key={pipeline.id}
          pipeline={pipeline}
          onEdit={() => onEdit(pipeline)}
          onDelete={() => onDelete(pipeline)}
          onExecute={() => onExecute(pipeline)}
        />
      ))}
    </div>
  );
}
