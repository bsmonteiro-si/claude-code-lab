import { apiFetch } from "./api";
import type {
  Template,
  TemplateCreateRequest,
  TemplateUpdateRequest,
  TemplateListResponse,
  TemplateVersion,
} from "../types/template";

export const templatesApi = {
  list(): Promise<TemplateListResponse> {
    return apiFetch<TemplateListResponse>("/api/templates/");
  },

  get(id: number): Promise<Template> {
    return apiFetch<Template>(`/api/templates/${id}`);
  },

  create(data: TemplateCreateRequest): Promise<Template> {
    return apiFetch<Template>("/api/templates/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: TemplateUpdateRequest): Promise<Template> {
    return apiFetch<Template>(`/api/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return apiFetch<void>(`/api/templates/${id}`, {
      method: "DELETE",
    });
  },

  listVersions(id: number): Promise<TemplateVersion[]> {
    return apiFetch<TemplateVersion[]>(`/api/templates/${id}/versions`);
  },
};
