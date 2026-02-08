const API_BASE = "http://localhost:8001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function cleanDatabase(): Promise<void> {
  const { pipelines } = await apiFetch<{ pipelines: { id: number }[] }>(
    "/api/pipelines/",
  );
  for (const p of pipelines) {
    await apiFetch(`/api/pipelines/${p.id}`, { method: "DELETE" });
  }

  const { templates } = await apiFetch<{ templates: { id: number }[] }>(
    "/api/templates/",
  );
  for (const t of templates) {
    await apiFetch(`/api/templates/${t.id}`, { method: "DELETE" });
  }
}
