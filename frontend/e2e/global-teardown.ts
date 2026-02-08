import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COMPOSE_FILE = "docker-compose.test.yml";

export default async function globalTeardown(): Promise<void> {
  console.log("Tearing down test containers...");
  execSync(`docker compose -f ${COMPOSE_FILE} down --volumes --remove-orphans`, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
  console.log("Test containers stopped.");
}
