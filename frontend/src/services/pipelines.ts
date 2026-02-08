import { apiFetch } from "./api";
import type {
  Pipeline,
  PipelineCreateRequest,
  PipelineExecution,
  PipelineExecutionListResponse,
  PipelineListResponse,
} from "../types/pipeline";

export const pipelinesApi = {
  list(): Promise<PipelineListResponse> {
    return apiFetch<PipelineListResponse>("/api/pipelines/");
  },

  get(id: number): Promise<Pipeline> {
    return apiFetch<Pipeline>(`/api/pipelines/${id}`);
  },

  create(data: PipelineCreateRequest): Promise<Pipeline> {
    return apiFetch<Pipeline>("/api/pipelines/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: PipelineCreateRequest): Promise<Pipeline> {
    return apiFetch<Pipeline>(`/api/pipelines/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return apiFetch<void>(`/api/pipelines/${id}`, {
      method: "DELETE",
    });
  },

  execute(id: number, variables: Record<string, string>): Promise<PipelineExecution> {
    return apiFetch<PipelineExecution>(`/api/pipelines/${id}/execute`, {
      method: "POST",
      body: JSON.stringify({ variables }),
    });
  },

  listExecutions(id: number): Promise<PipelineExecutionListResponse> {
    return apiFetch<PipelineExecutionListResponse>(`/api/pipelines/${id}/executions`);
  },

  listAllExecutions(): Promise<PipelineExecutionListResponse> {
    return apiFetch<PipelineExecutionListResponse>("/api/pipeline-executions/");
  },
};
