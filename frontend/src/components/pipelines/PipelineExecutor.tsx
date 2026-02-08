import { useMemo, useState } from "react";
import { pipelinesApi } from "../../services/pipelines";
import { templatesApi } from "../../services/templates";
import type { Pipeline } from "../../types/pipeline";
import type { PipelineExecution } from "../../types/pipeline";

interface PipelineExecutorProps {
  pipeline: Pipeline;
  onClose: () => void;
}

function extractVariableNames(content: string): string[] {
  const matches = content.matchAll(/\{\{(\w+)\}\}/g);
  const names = new Set<string>();
  for (const match of matches) {
    names.add(match[1]);
  }
  return Array.from(names);
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    completed: "badge-completed",
    failed: "badge-failed",
    running: "badge-running",
    pending: "badge-pending",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${styles[status] ?? styles.pending}`}
    >
      {status}
    </span>
  );
}

export default function PipelineExecutor({
  pipeline,
  onClose,
}: PipelineExecutorProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [execution, setExecution] = useState<PipelineExecution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialVariables, setInitialVariables] = useState<string[]>([]);
  const [isLoadingVars, setIsLoadingVars] = useState(true);

  useMemo(() => {
    if (pipeline.steps.length === 0) {
      setIsLoadingVars(false);
      return;
    }

    const firstStep = pipeline.steps[0];
    templatesApi.get(firstStep.template_id).then((template) => {
      const content = template.latest_version?.content ?? "";
      const allVars = extractVariableNames(content);
      const stepOutputVars = new Set(pipeline.steps.map((s) => s.output_variable));
      const userVars = allVars.filter((v) => !stepOutputVars.has(v));
      setInitialVariables(userVars);
      setIsLoadingVars(false);
    });
  }, [pipeline]);

  function handleVariableChange(name: string, value: string) {
    setVariables((prev) => ({ ...prev, [name]: value }));
  }

  async function handleExecute() {
    setIsExecuting(true);
    setExecution(null);
    setError(null);

    try {
      const result = await pipelinesApi.execute(pipeline.id, variables);
      setExecution(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to execute pipeline"
      );
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">
        Execute: {pipeline.name}
      </h2>

      {isLoadingVars ? (
        <p className="text-text-tertiary">Loading variables...</p>
      ) : (
        <div className="space-y-4">
          {initialVariables.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-label mb-2">
                Input Variables
              </h3>
              {initialVariables.map((name) => (
                <div key={name} className="mb-2">
                  <label
                    htmlFor={`var-${name}`}
                    className="block text-xs text-text-tertiary"
                  >
                    {name}
                  </label>
                  <input
                    id={`var-${name}`}
                    type="text"
                    placeholder={name}
                    value={variables[name] ?? ""}
                    onChange={(e) => handleVariableChange(name, e.target.value)}
                    className="mt-1 block w-full glass-input px-3 py-2"
                  />
                </div>
              ))}
            </div>
          )}

          {initialVariables.length === 0 && (
            <p className="text-sm text-text-tertiary">
              No input variables required for this pipeline.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleExecute}
          disabled={isExecuting || isLoadingVars}
          className="px-4 py-2 btn-glass-execute"
        >
          {isExecuting ? "Executing..." : "Execute"}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 btn-glass-secondary"
        >
          Close
        </button>
      </div>

      {execution && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-medium text-text-primary">Results</h3>
            {statusBadge(execution.status)}
          </div>

          <div className="space-y-3">
            {execution.step_executions.map((stepExec) => {
              const stepDef = pipeline.steps.find(
                (s) => s.step_order === stepExec.step_order
              );
              return (
                <div
                  key={stepExec.id}
                  className="border border-glass-border rounded-lg p-4 bg-glass-bg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs bg-glass-bg-active px-2 py-0.5 rounded-md text-text-secondary">
                      Step {stepExec.step_order}
                    </span>
                    {stepDef && (
                      <span className="text-sm text-text-secondary">
                        {stepDef.template_name}
                      </span>
                    )}
                    {statusBadge(stepExec.status)}
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-text-tertiary hover:text-text-secondary transition-colors">
                      Input Prompt
                    </summary>
                    <pre className="mt-1 p-2 glass-inset text-xs whitespace-pre-wrap text-text-secondary">
                      {stepExec.input_prompt}
                    </pre>
                  </details>

                  {stepExec.output && (
                    <div className="mt-2 p-3 result-success">
                      <p className="text-xs font-medium text-status-completed-text mb-1">
                        Output ({stepDef?.output_variable})
                      </p>
                      <pre className="text-sm text-green-300 whitespace-pre-wrap">
                        {stepExec.output}
                      </pre>
                    </div>
                  )}

                  {stepExec.error && (
                    <div className="mt-2 p-3 result-error">
                      <pre className="text-sm text-red-300 whitespace-pre-wrap">
                        {stepExec.error}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 result-error">
          <pre className="text-sm text-red-300 whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
