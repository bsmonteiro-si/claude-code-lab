export interface TemplateVersion {
  id: number;
  version_number: number;
  content: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  latest_version?: TemplateVersion;
}

export interface TemplateCreateRequest {
  name: string;
  description?: string;
  content: string;
}

export interface TemplateUpdateRequest {
  name?: string;
  description?: string;
  content?: string;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
}
