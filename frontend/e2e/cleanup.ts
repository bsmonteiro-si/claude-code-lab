import { ensureTestUser } from "./auth-helper";

const API_BASE = "http://localhost:8001";

async function apiFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...init,
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function cleanDatabase(): Promise<void> {
  const token = await ensureTestUser();

  const { pipelines } = await apiFetch<{ pipelines: { id: number }[] }>(
    "/api/pipelines/",
    token,
  );
  for (const p of pipelines) {
    await apiFetch(`/api/pipelines/${p.id}`, token, { method: "DELETE" });
  }

  const { templates } = await apiFetch<{ templates: { id: number }[] }>(
    "/api/templates/",
    token,
  );
  for (const t of templates) {
    await apiFetch(`/api/templates/${t.id}`, token, { method: "DELETE" });
  }
}
