# The Problem

Agents (`.claude/agents/`) only run when Claude decides to delegate via the Task tool, or when you start a separate session with `claude --agent <name>`. There's no built-in way to type `/agent-name` and force delegation mid-conversation.

## The Solution

A thin skill wrapper that injects the agent's instructions and forwards your input:

```yaml
---
name: backend
description: Delegate a task to the backend engineer
disable-model-invocation: true
context: fork
argument-hint: [task description]
hooks:
  Stop:
    - hooks:
        - type: command
          command: "cd \"$CLAUDE_PROJECT_DIR/backend\" && poetry run pytest -v"
          timeout: 120
          statusMessage: "Running backend tests..."
---

!`cat .claude/agents/backend-engineer.md`

$ARGUMENTS
```

- `disable-model-invocation: true` — only you can trigger it, Claude won't auto-invoke
- `context: fork` — runs in an isolated subagent, not in your main conversation
- `!`cat ...`` — dynamically injects the agent's full `.md` content as the subagent's prompt
- `$ARGUMENTS` — whatever you type after `/backend` becomes the task
- `hooks.Stop` — enforces test verification before the subagent can finish

### Why `!cat` Instead of `agent:`

The `agent:` frontmatter field only works with built-in agent types (`Explore`, `Plan`, `general-purpose`). Custom agents from `.claude/agents/` are not recognized — the subagent always spawns as `general-purpose` regardless. Using `!cat` to inject the agent content directly works around this limitation.

### Why Hooks Live in the Skill

Since the subagent runs as `general-purpose` (not as the custom agent), the agent's own frontmatter hooks never fire. The Stop hooks must be duplicated into the skill's frontmatter so they attach to the actual `general-purpose` subagent that executes.

## Available Skills

| Skill | Agent | Scope | Stop hook |
| --- | --- | --- | --- |
| `/backend` | `backend-engineer` | `backend/` directory | `poetry run pytest -v` |
| `/frontend` | `frontend-engineer` | `frontend/` directory | `npm run test && npm run lint` |
| `/devops` | `devops-engineer` | Root config files | `docker compose config --quiet` |

## Usage

```
/backend add a health check endpoint
/frontend add a loading spinner to the templates page
/devops add a redis service to docker-compose
```

The task runs in a forked context. The subagent gets the full agent persona (tech stack knowledge, conventions, testing instructions) injected via `!cat` and returns a summary to your main conversation when done.

## How It Works

```
You type: /backend add pagination to the templates list endpoint

1. Skill loads → !cat injects backend-engineer.md content
2. context: fork → spawns a general-purpose subagent
3. The subagent sees the agent instructions + your $ARGUMENTS
4. It reads files, implements the change
5. Stop hook runs pytest — subagent can't finish until tests pass
6. Summary comes back to your main conversation
```

## Context Between Calls

Each `/backend` call forks a **new, isolated subagent**. It has no memory of previous invocations.

What each fork sees:

- The agent's `.md` content injected into its prompt
- CLAUDE.md
- Your `$ARGUMENTS` as the task
- The actual files on disk (so it sees code written by previous agents)

What each fork does **not** see:

- Your main conversation history
- What previous calls discussed or decided
- The summary returned by earlier forks

If you need continuity between related tasks, either give enough context in the argument (`/backend add tests for the GET /health endpoint`) or skip the skill and ask Claude directly in the main thread where it has full history.

## Inline Alternative (No Fork)

If you want the agent's instructions injected into your main conversation instead of forking, drop `context: fork` and the hooks:

```yaml
---
name: backend
disable-model-invocation: true
---

!`cat .claude/agents/backend-engineer.md`

$ARGUMENTS
```

|  | `context: fork` | Inline (no fork) |
| --- | --- | --- |
| Conversation history | None | Full |
| Context between calls | Lost | Kept |
| Context window cost | Separate | Eats into yours |
| Isolation | Clean | Instructions mix with everything else |
| Stop hooks | Skill's hooks run on the subagent | Main session hooks run |

## Hook Enforcement

Stop hooks in the skill frontmatter **block** the subagent from finishing if verification fails. This is stronger than the "After You Finish" instructions in the agent body — instructions are suggestions Claude *should* follow, hooks are enforcement that *prevents* completion until the check passes.

The hooks are duplicated in two places:

| Location | Fires when | Purpose |
| --- | --- | --- |
| Agent frontmatter (`.claude/agents/*.md`) | `claude --agent <name>` sessions | Enforces tests when agent runs standalone |
| Skill frontmatter (`.claude/skills/*/SKILL.md`) | `/backend`, `/frontend`, `/devops` | Enforces tests when agent runs via skill delegation |

Both need to exist because they cover different execution paths.

## Transcript Saving

Subagent transcripts are automatically saved by the `SubagentStop` hook in `.claude/settings.json`. The unified `save-transcript.sh` script detects whether it's a session or subagent context and writes to:

- Sessions → `.claude/transcripts/session_<timestamp>_<id>.md`
- Subagents → `.claude/transcripts/subagents/<type>_<timestamp>_<id>.md`

Note: since skills spawn `general-purpose` subagents, the transcript filename will show `general-purpose` as the agent type, not the custom agent name.

## Files

```
.claude/skills/backend/SKILL.md   → injects .claude/agents/backend-engineer.md
.claude/skills/frontend/SKILL.md  → injects .claude/agents/frontend-engineer.md
.claude/skills/devops/SKILL.md    → injects .claude/agents/devops-engineer.md
```
