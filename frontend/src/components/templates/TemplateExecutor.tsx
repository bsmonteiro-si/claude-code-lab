import { useEffect, useState } from "react";
import { executionsApi, providersApi } from "../../services/executions";
import type { Provider } from "../../types/execution";
import type { Template } from "../../types/template";

interface TemplateExecutorProps {
  template: Template;
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

export default function TemplateExecutor({
  template,
  onClose,
}: TemplateExecutorProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const variableNames = extractVariableNames(
    template.latest_version?.content ?? ""
  );

  const availableModels =
    providers.find((p) => p.name === selectedProvider)?.models ?? [];

  useEffect(() => {
    providersApi.list().then((response) => {
      setProviders(response.providers);
      if (response.providers.length > 0) {
        setSelectedProvider(response.providers[0].name);
        if (response.providers[0].models.length > 0) {
          setSelectedModel(response.providers[0].models[0]);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (availableModels.length > 0) {
      setSelectedModel(availableModels[0]);
    } else {
      setSelectedModel("");
    }
  }, [selectedProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleVariableChange(name: string, value: string) {
    setVariables((prev) => ({ ...prev, [name]: value }));
  }

  async function handleExecute() {
    setIsExecuting(true);
    setOutput(null);
    setError(null);

    try {
      const result = await executionsApi.create({
        template_id: template.id,
        provider: selectedProvider,
        model: selectedModel,
        variables,
      });
      if (result.output) {
        setOutput(result.output);
      }
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to execute template"
      );
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="glass-panel p-6">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">
        Execute: {template.name}
      </h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="provider"
            className="block text-sm font-medium text-text-label"
          >
            Provider
          </label>
          <select
            id="provider"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="mt-1 block w-full glass-input px-3 py-2"
          >
            {providers.map((provider) => (
              <option key={provider.name} value={provider.name}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="model"
            className="block text-sm font-medium text-text-label"
          >
            Model
          </label>
          <select
            id="model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="mt-1 block w-full glass-input px-3 py-2"
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {variableNames.map((name) => (
          <div key={name}>
            <label
              htmlFor={`var-${name}`}
              className="block text-sm font-medium text-text-label"
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

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleExecute}
          disabled={isExecuting}
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

      {output && (
        <div className="mt-4 p-4 result-success">
          <h3 className="text-sm font-medium text-status-completed-text mb-2">Output</h3>
          <pre className="text-sm text-green-300 whitespace-pre-wrap">
            {output}
          </pre>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 result-error">
          <h3 className="text-sm font-medium text-status-failed-text mb-2">Error</h3>
          <pre className="text-sm text-red-300 whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
