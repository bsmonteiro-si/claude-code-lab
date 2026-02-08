import { useCallback, useEffect, useState } from "react";
import { templatesApi } from "../services/templates";
import type { Template } from "../types/template";
import TemplateList from "../components/templates/TemplateList";
import TemplateForm from "../components/templates/TemplateForm";
import TemplateExecutor from "../components/templates/TemplateExecutor";

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [executingTemplate, setExecutingTemplate] = useState<Template | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await templatesApi.list();
      setTemplates(response.templates);
    } catch {
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function handleCreate() {
    setSelectedTemplate(null);
    setShowForm(true);
  }

  function handleEdit(template: Template) {
    setSelectedTemplate(template);
    setShowForm(true);
  }

  async function handleDelete(template: Template) {
    await templatesApi.delete(template.id);
    loadTemplates();
  }

  function handleExecute(template: Template) {
    setExecutingTemplate(template);
  }

  function handleCloseExecutor() {
    setExecutingTemplate(null);
  }

  function handleSave() {
    setShowForm(false);
    setSelectedTemplate(null);
    loadTemplates();
  }

  function handleCancel() {
    setShowForm(false);
    setSelectedTemplate(null);
  }

  function renderContent() {
    if (executingTemplate) {
      return (
        <TemplateExecutor
          template={executingTemplate}
          onClose={handleCloseExecutor}
        />
      );
    }

    if (showForm) {
      return (
        <TemplateForm
          template={selectedTemplate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      );
    }

    return (
      <TemplateList
        templates={templates}
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
        <h1 className="text-2xl font-bold text-text-primary">Templates</h1>
        {!showForm && !executingTemplate && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 btn-glass-primary"
          >
            New Template
          </button>
        )}
      </div>

      {renderContent()}
    </div>
  );
}
