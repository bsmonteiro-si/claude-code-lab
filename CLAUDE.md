# LLM Prompt Lab

Full-stack prompt engineering platform for designing, testing, and iterating on LLM prompts with real-time feedback.

## Development Workflow

Every code change that affects the frontend — including backend changes to API routes, schemas, or behavior — must follow this feedback loop:

1. **Unit tests** — Run backend (`cd backend && poetry run pytest -v`) and frontend (`cd frontend && npm test && npm run lint`) unit tests to confirm correctness at the code level.
2. **Browser verification** — Use Claude in Chrome to manually exercise the change in the running app (http://localhost:5173). Navigate the real UI, fill forms, trigger the feature, and confirm it works visually.
3. **Playwright scripts** — Add or update E2E tests in `frontend/e2e/` to cover the new or changed behavior. Follow existing conventions (shared helpers in `auth-helper.ts`, cleanup in `cleanup.ts`).
4. **Full E2E suite** — Run `cd frontend && npx playwright test` to confirm all 11+ tests pass. This rebuilds the Docker test environment, runs migrations on a fresh PostgreSQL database, and exercises the app end-to-end.

At the end of every session, run `/save-session` to save a structured summary to `.claude/sessions/`. This gives future sessions context about what was done, decisions made, and files changed.

### Running Playwright Tests

```bash
# Full suite (parallel, headless)
cd frontend && npx playwright test

# Slow mode — opens a visible browser with 800ms delay between actions
cd frontend && SLOW=1 npx playwright test --headed

# Single test file
cd frontend && npx playwright test e2e/auth.spec.ts

# Single test by name
cd frontend && npx playwright test -g "register a new account"

# Combine: single test in slow mode
cd frontend && SLOW=1 npx playwright test --headed -g "register a new account"
```

The test environment uses `docker-compose.test.yml` (PostgreSQL on 5433, backend on 8001) and a Vite dev server on 5174. Global setup/teardown handle container lifecycle automatically.

## Tech Stack

- **Backend:** Python 3.12 / FastAPI / SQLAlchemy / Poetry
- **Frontend:** React / TypeScript / Vite
- **Database:** PostgreSQL 16
- **Containerization:** Docker / Docker Compose

## Project Structure

```
claude-code-lab/
  backend/         # FastAPI application
  backend/alembic/ # Database migrations
  frontend/        # React + TypeScript application
  .claude/commands/ # Slash commands for development workflows
  docker-compose.yml
```

## How to Run

### Backend

```bash
cd backend && poetry run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend && npm run dev
```

### Tests

```bash
# Backend
cd backend && poetry run pytest -v

# Frontend
cd frontend && npm test
```

### Database Migrations

```bash
cd backend && alembic upgrade head
```

### Full Stack (Docker)

```bash
docker compose up
```

## Coding Conventions

- No redundant comments. Extract a well-named function instead of adding a comment.
- Variables must be descriptive and provide meaningful context.
- Functions should be small and focused, doing exactly one thing.
- Prefer standard patterns: Strategy for multiple if-else chains, Chain of Responsibility for pipelines.
- Follow Clean Architecture principles.

## Testing Conventions

- Follow the Given / When / Then pattern in every test.
- Keep tests small and focused; the test body should read like documentation.
- Verify behavior (end state of the system), not interactions (mock call counts).
- Extract reusable assertions into helper functions when multiple checks repeat.

## Database

- PostgreSQL with ACID guarantees by default.
- Identify potential performance bottlenecks early: add indexes for frequent query patterns, avoid N+1 queries.
- Use migrations for all schema changes.

## Engine

- **Variable substitution:** Templates use `{{variable}}` placeholders that are replaced with provided values at execution time.
- **LLM Providers:** Anthropic and OpenAI are supported. Providers follow a strategy pattern and live in `app/engine/providers/`. New providers are added by implementing the provider interface.
- **Execution tracking:** Every template execution is logged with its status, output, and error (if any).

## Pipelines

- **Multi-step execution:** Pipelines chain multiple template executions. Each step references an existing template, specifies a provider/model, and defines an `output_variable`.
- **Output chaining:** The output of each step is stored under its `output_variable` name and becomes available as a `{{variable}}` in subsequent steps' templates.
- **Execution flow:** The engine processes steps in order. If a step fails, the pipeline is marked as failed and remaining steps are skipped.
- **Models:** `Pipeline` → `PipelineStep` (ordered, cascade delete). `PipelineExecution` → `PipelineStepExecution` (tracks each step's input, output, status).
- **API:** CRUD at `/api/pipelines/`, execution via `POST /api/pipelines/{id}/execute`, history via `GET /api/pipelines/{id}/executions`.

# Claude for Chrome

## Speed Principles

- NEVER take screenshots unless explicitly requested by the user
- Minimize round trips: every tool call is a full LLM-to-browser round trip — fewer calls = faster
- Trust actions succeeded — do not verify after every click unless something seems wrong

## Element Interaction

- Use `find` for targeted element lookup — one call instead of scanning the full tree
- Click/interact using `ref`, not coordinates
- For known pages (this app), skip `read_page` entirely — go straight to `find` or `javascript_tool`

## Batch Operations with `javascript_tool`

- Prefer `javascript_tool` for multi-step DOM interactions — one JS call replaces 5+ round trips
- Use it for: filling multiple form fields, reading multiple values, click-then-verify sequences
- React forms need event dispatch: set `.value` then trigger `new Event('input', {bubbles: true})`

## Scoped `read_page`

- When `read_page` is needed, always scope it:
  - `filter: "interactive"` — returns only buttons/links/inputs, cuts output 50-93%
  - `depth: 3-5` — limits tree traversal
  - `ref_id` — reads a specific subtree instead of the whole page
- Use `get_page_text` instead of `read_page` when you only need to read content, not interact

## App Structure (skip exploration for these)

- Sidebar: nav links Home `/`, Templates `/templates`, Pipelines `/pipelines`, Executions `/executions`
- Theme picker: bottom of sidebar, buttons with `title` attr per theme name
- Template form: labels "Name", "Description", "Content" (textarea), buttons "Save", "Cancel"
- Pipeline form: labels "Name", "Description", steps with selects for Template/Provider/Model and input for Output Variable
- Executions page: two tab buttons "Template Executions" / "Pipeline Executions"
