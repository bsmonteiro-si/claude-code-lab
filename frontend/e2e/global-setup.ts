import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COMPOSE_FILE = "docker-compose.test.yml";
const BACKEND_HEALTH_URL = "http://localhost:8001/health";
const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;

async function waitForBackend(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(BACKEND_HEALTH_URL);
      if (response.ok) return;
    } catch {
      // Backend not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
  }
  throw new Error(`Backend did not become healthy after ${MAX_RETRIES} attempts`);
}

export default async function globalSetup(): Promise<void> {
  console.log("Tearing down any stale test containers...");
  execSync(`docker compose -f ${COMPOSE_FILE} down --volumes --remove-orphans`, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

  console.log("Starting test containers...");
  execSync(`docker compose -f ${COMPOSE_FILE} up -d --build`, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });

  console.log("Waiting for backend to be healthy...");
  await waitForBackend();
  console.log("Backend is ready.");
}
