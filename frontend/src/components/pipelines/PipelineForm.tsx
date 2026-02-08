import { useEffect, useState } from "react";
import { pipelinesApi } from "../../services/pipelines";
import { templatesApi } from "../../services/templates";
import { providersApi } from "../../services/executions";
import type { Template } from "../../types/template";
import type { Provider } from "../../types/execution";
import type { Pipeline, PipelineStepCreateRequest } from "../../types/pipeline";

interface PipelineFormProps {
  pipeline: Pipeline | null;
  onSave: () => void;
  onCancel: () => void;
}

interface StepDraft {
  template_id: number | "";
  provider: string;
  model: string;
  output_variable: string;
}

function emptyStep(): StepDraft {
  return { template_id: "", provider: "", model: "", output_variable: "" };
}

export default function PipelineForm({
  pipeline,
  onSave,
  onCancel,
}: PipelineFormProps) {
  const [name, setName] = useState(pipeline?.name ?? "");
  const [description, setDescription] = useState(pipeline?.description ?? "");
  const [steps, setSteps] = useState<StepDraft[]>(() => {
    if (pipeline) {
      return pipeline.steps.map((s) => ({
        template_id: s.template_id,
        provider: s.provider,
        model: s.model,
        output_variable: s.output_variable,
      }));
    }
    return [emptyStep()];
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = pipeline !== null;

  useEffect(() => {
    templatesApi.list().then((r) => setTemplates(r.templates));
    providersApi.list().then((r) => setProviders(r.providers));
  }, []);

  function updateStep(index: number, partial: Partial<StepDraft>) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...partial } : s))
    );
  }

  function addStep() {
    setSteps((prev) => [...prev, emptyStep()]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function modelsForProvider(providerName: string): string[] {
    return providers.find((p) => p.name === providerName)?.models ?? [];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const validSteps: PipelineStepCreateRequest[] = steps.map((s) => ({
      template_id: Number(s.template_id),
      provider: s.provider,
      model: s.model,
      output_variable: s.output_variable,
    }));

    try {
      if (isEditing) {
        await pipelinesApi.update(pipeline.id, {
          name,
          description,
          steps: validSteps,
        });
      } else {
        await pipelinesApi.create({ name, description, steps: validSteps });
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save pipeline");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">
        {isEditing ? "Edit Pipeline" : "New Pipeline"}
      </h2>

      {error && <p className="mb-4 text-status-failed-text text-sm">{error}</p>}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="pipeline-name"
            className="block text-sm font-medium text-text-label"
          >
            Name
          </label>
          <input
            id="pipeline-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full glass-input px-3 py-2"
          />
        </div>

        <div>
          <label
            htmlFor="pipeline-description"
            className="block text-sm font-medium text-text-label"
          >
            Description
          </label>
          <input
            id="pipeline-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full glass-input px-3 py-2"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-text-label">
              Steps
            </label>
            <button
              type="button"
              onClick={addStep}
              className="text-sm text-accent-primary hover:text-accent-primary-hover transition-colors"
            >
              + Add Step
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="border border-glass-border rounded-lg p-4 space-y-3 bg-glass-bg"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-tertiary">
                    Step {index + 1}
                  </span>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-sm text-accent-danger hover:text-accent-danger-hover transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-text-tertiary">
                      Template
                    </label>
                    <select
                      required
                      value={step.template_id}
                      onChange={(e) =>
                        updateStep(index, {
                          template_id:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        })
                      }
                      className="mt-1 block w-full glass-input px-3 py-2 text-sm"
                    >
                      <option value="">Select template</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-text-tertiary">
                      Output Variable
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. english_text"
                      value={step.output_variable}
                      onChange={(e) =>
                        updateStep(index, { output_variable: e.target.value })
                      }
                      className="mt-1 block w-full glass-input px-3 py-2 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-tertiary">
                      Provider
                    </label>
                    <select
                      required
                      value={step.provider}
                      onChange={(e) => {
                        const newProvider = e.target.value;
                        const models = modelsForProvider(newProvider);
                        updateStep(index, {
                          provider: newProvider,
                          model: models[0] ?? "",
                        });
                      }}
                      className="mt-1 block w-full glass-input px-3 py-2 text-sm"
                    >
                      <option value="">Select provider</option>
                      {providers.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-text-tertiary">Model</label>
                    <select
                      required
                      value={step.model}
                      onChange={(e) =>
                        updateStep(index, { model: e.target.value })
                      }
                      className="mt-1 block w-full glass-input px-3 py-2 text-sm"
                    >
                      <option value="">Select model</option>
                      {modelsForProvider(step.provider).map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 btn-glass-primary"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 btn-glass-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
