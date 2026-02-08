import { useCallback, useEffect, useState } from "react";
import { pipelinesApi } from "../services/pipelines";
import type { Pipeline } from "../types/pipeline";
import PipelineList from "../components/pipelines/PipelineList";
import PipelineForm from "../components/pipelines/PipelineForm";
import PipelineExecutor from "../components/pipelines/PipelineExecutor";

export default function Pipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [executingPipeline, setExecutingPipeline] = useState<Pipeline | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadPipelines = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await pipelinesApi.list();
      setPipelines(response.pipelines);
    } catch {
      setPipelines([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipelines();
  }, [loadPipelines]);

  function handleCreate() {
    setSelectedPipeline(null);
    setShowForm(true);
  }

  function handleEdit(pipeline: Pipeline) {
    setSelectedPipeline(pipeline);
    setShowForm(true);
  }

  async function handleDelete(pipeline: Pipeline) {
    await pipelinesApi.delete(pipeline.id);
    loadPipelines();
  }

  function handleExecute(pipeline: Pipeline) {
    setExecutingPipeline(pipeline);
  }

  function handleCloseExecutor() {
    setExecutingPipeline(null);
  }

  function handleSave() {
    setShowForm(false);
    setSelectedPipeline(null);
    loadPipelines();
  }

  function handleCancel() {
    setShowForm(false);
    setSelectedPipeline(null);
  }

  function renderContent() {
    if (executingPipeline) {
      return (
        <PipelineExecutor
          pipeline={executingPipeline}
          onClose={handleCloseExecutor}
        />
      );
    }

    if (showForm) {
      return (
        <PipelineForm
          pipeline={selectedPipeline}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }

    return (
      <PipelineList
        pipelines={pipelines}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onExecute={handleExecute}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Pipelines</h1>
        {!showForm && !executingPipeline && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 btn-glass-primary"
          >
            New Pipeline
          </button>
        )}
      </div>

      {renderContent()}
    </div>
  );
}
