import type { Template } from "../../types/template";

interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onExecute: (template: Template) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

function contentPreview(template: Template): string {
  const content = template.latest_version?.content ?? "";
  if (content.length <= 200) return content;
  return content.slice(0, 200) + "...";
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
  onExecute,
}: {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  onExecute: () => void;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-text-primary">{template.name}</h3>
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
      {template.description && (
        <p className="mt-2 text-text-secondary">{template.description}</p>
      )}
      <pre className="mt-3 p-3 glass-inset text-sm text-text-secondary font-mono whitespace-pre-wrap">
        {contentPreview(template)}
      </pre>
      <div className="mt-3 flex gap-4 text-xs text-text-tertiary">
        {template.latest_version && (
          <span>v{template.latest_version.version_number}</span>
        )}
        <span>{formatDate(template.created_at)}</span>
      </div>
    </div>
  );
}

export default function TemplateList({
  templates,
  isLoading,
  onEdit,
  onDelete,
  onExecute,
}: TemplateListProps) {
  if (isLoading) {
    return <p className="text-text-tertiary">Loading templates...</p>;
  }

  if (templates.length === 0) {
    return <p className="text-text-tertiary">No templates yet.</p>;
  }

  return (
    <div className="grid gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={() => onEdit(template)}
          onDelete={() => onDelete(template)}
          onExecute={() => onExecute(template)}
        />
      ))}
    </div>
  );
}
