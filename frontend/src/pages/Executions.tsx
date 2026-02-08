import { useCallback, useEffect, useState } from "react";
import { executionsApi } from "../services/executions";
import { pipelinesApi } from "../services/pipelines";
import type { Execution, ExecutionStatus } from "../types/execution";
import type { PipelineExecution } from "../types/pipeline";

const STATUS_STYLES: Record<ExecutionStatus, string> = {
  completed: "badge-completed",
  failed: "badge-failed",
  running: "badge-running",
  pending: "badge-pending",
};

function StatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-medium rounded-md ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

function TemplateExecutionRow({ execution }: { execution: Execution }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer hover:bg-glass-bg-hover transition-colors"
      >
        <td className="px-6 py-4 text-sm text-text-primary">
          {execution.template_name}
        </td>
        <td className="px-6 py-4 text-sm text-text-secondary">
          {execution.provider}/{execution.model}
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={execution.status} />
        </td>
        <td className="px-6 py-4 text-sm text-text-tertiary">
          {formatDate(execution.created_at)}
        </td>
        <td className="px-6 py-4 text-sm text-text-tertiary">
          {expanded ? "\u25B2" : "\u25BC"}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-glass-bg">
            <div className="space-y-3">
              {Object.keys(execution.variables).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-tertiary mb-1">
                    Variables
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(execution.variables).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-1 rounded-md font-mono border border-accent-primary/20"
                      >
                        {key}={value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {execution.output && (
                <div className="p-3 result-success">
                  <p className="text-xs font-medium text-status-completed-text mb-1">
                    Output
                  </p>
                  <pre className="text-sm text-green-300 whitespace-pre-wrap">
                    {execution.output}
                  </pre>
                </div>
              )}
              {execution.error && (
                <div className="p-3 result-error">
                  <p className="text-xs font-medium text-status-failed-text mb-1">
                    Error
                  </p>
                  <pre className="text-sm text-red-300 whitespace-pre-wrap">
                    {execution.error}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PipelineExecutionRow({ execution }: { execution: PipelineExecution }) {
  const [expanded, setExpanded] = useState(false);

  const completedSteps = execution.step_executions.filter(
    (s) => s.status === "completed"
  ).length;
  const totalSteps = execution.step_executions.length;

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        className="cursor-pointer hover:bg-glass-bg-hover transition-colors"
      >
        <td className="px-6 py-4 text-sm text-text-primary">
          {execution.pipeline_name}
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={execution.status} />
        </td>
        <td className="px-6 py-4 text-sm text-text-secondary">
          {completedSteps}/{totalSteps}
        </td>
        <td className="px-6 py-4 text-sm text-text-tertiary">
          {formatDate(execution.created_at)}
        </td>
        <td className="px-6 py-4 text-sm text-text-tertiary">
          {expanded ? "\u25B2" : "\u25BC"}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-glass-bg">
            <div className="space-y-3">
              {Object.keys(execution.variables).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-tertiary mb-1">
                    Input Variables
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(execution.variables).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-accent-primary/10 text-accent-primary px-2 py-1 rounded-md font-mono border border-accent-primary/20"
                      >
                        {key}={value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {execution.step_executions.map((step) => (
                  <StepExecutionDetail key={step.id} step={step} />
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function StepExecutionDetail({
  step,
}: {
  step: PipelineExecution["step_executions"][number];
}) {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="border border-glass-border rounded-lg p-3 bg-glass-bg">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-xs bg-glass-bg-active px-2 py-0.5 rounded-md text-text-secondary">
          Step {step.step_order}
        </span>
        <StatusBadge status={step.status} />
      </div>

      <button
        onClick={() => setShowPrompt(!showPrompt)}
        className="text-xs text-text-tertiary hover:text-text-secondary cursor-pointer transition-colors"
      >
        {showPrompt ? "\u25B2 Hide prompt" : "\u25B6 Show prompt"}
      </button>
      {showPrompt && (
        <pre className="mt-1 p-2 glass-inset text-xs whitespace-pre-wrap text-text-secondary">
          {step.input_prompt}
        </pre>
      )}

      {step.output && (
        <div className="mt-2 p-2 result-success">
          <pre className="text-sm text-green-300 whitespace-pre-wrap">
            {step.output}
          </pre>
        </div>
      )}
      {step.error && (
        <div className="mt-2 p-2 result-error">
          <pre className="text-sm text-red-300 whitespace-pre-wrap">
            {step.error}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function Executions() {
  const [activeTab, setActiveTab] = useState<"template" | "pipeline">(
    "template"
  );
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [pipelineExecutions, setPipelineExecutions] = useState<
    PipelineExecution[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplateExecutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await executionsApi.list();
      setExecutions(response.executions);
    } catch {
      setExecutions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPipelineExecutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await pipelinesApi.listAllExecutions();
      setPipelineExecutions(response.executions);
    } catch {
      setPipelineExecutions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "template") {
      loadTemplateExecutions();
    } else {
      loadPipelineExecutions();
    }
  }, [activeTab, loadTemplateExecutions, loadPipelineExecutions]);

  const tabClass = (tab: string) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${
      activeTab === tab
        ? "bg-glass-bg-active text-accent-primary border-b-2 border-accent-primary"
        : "text-text-tertiary hover:text-text-secondary"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-text-primary">Executions</h1>

      <div className="flex gap-1 mb-4 border-b border-glass-border">
        <button
          className={tabClass("template")}
          onClick={() => setActiveTab("template")}
        >
          Template Executions
        </button>
        <button
          className={tabClass("pipeline")}
          onClick={() => setActiveTab("pipeline")}
        >
          Pipeline Executions
        </button>
      </div>

      {isLoading && <p className="text-text-tertiary">Loading executions...</p>}

      {!isLoading && activeTab === "template" && executions.length === 0 && (
        <p className="text-text-tertiary">No template executions yet.</p>
      )}

      {!isLoading && activeTab === "template" && executions.length > 0 && (
        <div className="glass-table">
          <table className="min-w-full">
            <thead>
              <tr className="bg-glass-bg">
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Provider / Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {executions.map((execution) => (
                <TemplateExecutionRow
                  key={execution.id}
                  execution={execution}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading &&
        activeTab === "pipeline" &&
        pipelineExecutions.length === 0 && (
          <p className="text-text-tertiary">No pipeline executions yet.</p>
        )}

      {!isLoading &&
        activeTab === "pipeline" &&
        pipelineExecutions.length > 0 && (
          <div className="glass-table">
            <table className="min-w-full">
              <thead>
                <tr className="bg-glass-bg">
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Pipeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Steps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {pipelineExecutions.map((execution) => (
                  <PipelineExecutionRow
                    key={execution.id}
                    execution={execution}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
