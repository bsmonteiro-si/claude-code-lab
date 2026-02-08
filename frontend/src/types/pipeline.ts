import type { ExecutionStatus } from "./execution";

export interface PipelineStep {
  id: number;
  step_order: number;
  template_id: number;
  template_name: string;
  provider: string;
  model: string;
  output_variable: string;
}

export interface Pipeline {
  id: number;
  name: string;
  description?: string;
  steps: PipelineStep[];
  created_at: string;
  updated_at?: string;
}

export interface PipelineStepCreateRequest {
  template_id: number;
  provider: string;
  model: string;
  output_variable: string;
}

export interface PipelineCreateRequest {
  name: string;
  description?: string;
  steps: PipelineStepCreateRequest[];
}

export interface PipelineListResponse {
  pipelines: Pipeline[];
  total: number;
}

export interface PipelineStepExecution {
  id: number;
  step_order: number;
  input_prompt: string;
  output?: string;
  status: ExecutionStatus;
  error?: string;
}

export interface PipelineExecution {
  id: number;
  pipeline_id: number;
  pipeline_name: string;
  status: ExecutionStatus;
  variables: Record<string, string>;
  step_executions: PipelineStepExecution[];
  created_at: string;
  completed_at?: string;
}

export interface PipelineExecutionListResponse {
  executions: PipelineExecution[];
  total: number;
}
