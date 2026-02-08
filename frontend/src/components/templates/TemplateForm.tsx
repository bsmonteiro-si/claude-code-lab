import { useState } from "react";
import { templatesApi } from "../../services/templates";
import type { Template } from "../../types/template";

interface TemplateFormProps {
  template: Template | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function TemplateForm({
  template,
  onSave,
  onCancel,
}: TemplateFormProps) {
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(
    template?.description ?? ""
  );
  const [content, setContent] = useState(
    template?.latest_version?.content ?? ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = template !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await templatesApi.update(template.id, { name, description, content });
      } else {
        await templatesApi.create({ name, description, content });
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">
        {isEditing ? "Edit Template" : "New Template"}
      </h2>

      {error && (
        <p className="mb-4 text-status-failed-text text-sm">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-label">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full glass-input px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-label">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full glass-input px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-text-label">
            Content
          </label>
          <textarea
            id="content"
            required
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full glass-input px-3 py-2 font-mono text-sm"
          />
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
