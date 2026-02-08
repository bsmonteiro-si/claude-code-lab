export type ExecutionStatus = "pending" | "running" | "completed" | "failed";

export interface Execution {
  id: number;
  template_id: number;
  template_name: string;
  provider: string;
  model: string;
  variables: Record<string, string>;
  status: ExecutionStatus;
  output?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface ExecutionCreateRequest {
  template_id: number;
  provider: string;
  model: string;
  variables: Record<string, string>;
}

export interface ExecutionListResponse {
  executions: Execution[];
  total: number;
}

export interface Provider {
  name: string;
  models: string[];
}
