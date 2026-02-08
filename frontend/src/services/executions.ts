import { apiFetch } from "./api";
import type {
  Execution,
  ExecutionCreateRequest,
  ExecutionListResponse,
  Provider,
} from "../types/execution";

export const executionsApi = {
  create(data: ExecutionCreateRequest): Promise<Execution> {
    return apiFetch<Execution>("/api/executions/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list(): Promise<ExecutionListResponse> {
    return apiFetch<ExecutionListResponse>("/api/executions/");
  },

  get(id: number): Promise<Execution> {
    return apiFetch<Execution>(`/api/executions/${id}`);
  },
};

export const providersApi = {
  list(): Promise<{ providers: Provider[] }> {
    return apiFetch<{ providers: Provider[] }>("/api/providers/");
  },
};
