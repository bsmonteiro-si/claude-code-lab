# Claude Code Subagents Guide

## What Are Subagents?

Subagents are specialized AI assistants spawned via the **Task tool** to handle specific types of work. Each subagent runs in its own isolated context window with its own system prompt, tool access restrictions, and permissions. They work autonomously and return a summary of results back to the main conversation.

Key properties:

- **Isolated context** -- exploration and verbose output stay out of the main conversation
- **Restricted tools** -- each subagent can be limited to only the tools it needs
- **Independent permissions** -- permission modes can differ from the main session
- **Model selection** -- route tasks to faster/cheaper models when appropriate

Subagents operate within a single session. For parallel work across multiple sessions, use Agent Teams instead.

---

## When to Use Subagents

### Good Fit

| Scenario                               | Why                                                               |
|----------------------------------------|-------------------------------------------------------------------|
| High-volume output (tests, logs, docs) | Verbose output stays in the subagent; only a summary returns      |
| Parallel research                      | Spawn multiple subagents exploring different areas simultaneously |
| Read-only analysis                     | Restrict tools to prevent unintended modifications                |
| Domain-specific tasks                  | Custom system prompts tuned for specific expertise                |
| Cost-sensitive operations              | Route to Haiku for simple, high-volume work                       |

### Poor Fit

| Scenario                                       | Better Alternative                                                     |
|------------------------------------------------|------------------------------------------------------------------------|
| Frequent back-and-forth with the user          | Main conversation                                                      |
| Multiple phases sharing significant context    | Main conversation                                                      |
| Quick, targeted single-file changes            | Direct tool calls (latency overhead not worth it)                      |
| Nested delegation (subagent spawning subagent) | Chain from main conversation -- subagents cannot spawn other subagents |
| Reusable prompts running in main context       | Skills                                                                 |

---

## Built-in Subagent Types

### Explore

- **Model:** Haiku (fast, low-latency)
- **Tools:** Read-only (Read, Grep, Glob -- no Write or Edit)
- **Purpose:** File discovery, code search, codebase understanding
- **Thoroughness levels:** `quick`, `medium`, `very thorough`

### Plan

- **Model:** Inherits from main conversation
- **Tools:** Read-only
- **Purpose:** Gather context during plan mode before presenting a plan to the user

### General-purpose

- **Model:** Inherits from main conversation
- **Tools:** All tools
- **Purpose:** Complex, multi-step tasks requiring both exploration and action

### Bash

- **Purpose:** Command execution in a separate context

### claude-code-guide

- **Purpose:** Answers questions about Claude Code features, hooks, MCP servers, settings, and the Agent SDK

---

## Task Tool Parameters

The Task tool is how subagents are invoked. Its key parameters:

| Parameter           | Required | Description                                                                  |
|---------------------|----------|------------------------------------------------------------------------------|
| `prompt`            | Yes      | The task for the subagent to perform                                         |
| `description`       | Yes      | Short (3-5 word) summary of the task                                         |
| `subagent_type`     | Yes      | Which agent type to use (`Explore`, `Plan`, `Bash`, `general-purpose`, etc.) |
| `model`             | No       | Override model (`sonnet`, `opus`, `haiku`). Defaults to inherit.             |
| `max_turns`         | No       | Maximum agentic turns before stopping                                        |
| `run_in_background` | No       | Run concurrently while continuing work in the main conversation              |
| `resume`            | No       | Agent ID from a previous invocation to continue with full prior context      |

---

## Creating Custom Subagents

### File-based (Recommended)

Create a markdown file with YAML frontmatter at one of these locations (listed by priority):

| Location                     | Scope                                        |
|------------------------------|----------------------------------------------|
| `.claude/agents/<name>.md`   | Current project (check into version control) |
| `~/.claude/agents/<name>.md` | All projects for this user                   |

Example file `.claude/agents/code-reviewer.md`:

```markdown
---
name: code-reviewer
description: Expert code review specialist. Reviews code for quality, security, and maintainability.
tools: Read, Glob, Grep, Bash
model: sonnet
maxTurns: 20
---

You are a senior code reviewer. When invoked:

1. Run git diff to see recent changes
2. Focus on modified files
3. Check for security vulnerabilities, code quality, and adherence to project conventions
4. Return a structured review with findings ranked by severity
```

### Interactive Creation

Run `/agents` in Claude Code, then select "Create new agent" and choose a scope.

### CLI Flag (Session-only)

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

---

## Frontmatter Reference

| Field             | Required | Type     | Description                                                      |
|-------------------|----------|----------|------------------------------------------------------------------|
| `name`            | Yes      | string   | Unique identifier (lowercase, hyphens)                           |
| `description`     | Yes      | string   | When Claude should delegate to this agent                        |
| `tools`           | No       | string[] | Allowed tools (inherits all if omitted)                          |
| `disallowedTools` | No       | string[] | Tools to explicitly deny                                         |
| `model`           | No       | string   | `sonnet`, `opus`, `haiku`, or `inherit` (default)                |
| `permissionMode`  | No       | string   | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns`        | No       | number   | Maximum agentic turns                                            |
| `skills`          | No       | string[] | Skills to preload into context                                   |
| `mcpServers`      | No       | object   | MCP servers available to the subagent                            |
| `hooks`           | No       | object   | Lifecycle hooks scoped to this subagent                          |
| `memory`          | No       | string   | `user`, `project`, or `local` for persistent memory              |

---

## Controlling Capabilities

### Restrict Tools (Allowlist)

```yaml
tools: Read, Grep, Glob
```

### Deny Tools (Denylist)

```yaml
disallowedTools: Write, Edit
```

### Restrict Which Subagents Can Be Spawned

```yaml
tools: Task(worker, researcher), Read, Bash
```

Only `worker` and `researcher` can be spawned. Omitting `Task` entirely prevents any subagent spawning.

### Disable Specific Subagents

In `settings.json`:

```json
{
  "permissions": {
    "deny": ["Task(Explore)", "Task(my-custom-agent)"]
  }
}
```

---

## Foreground vs. Background Execution

|                        | Foreground                     | Background                                   |
|------------------------|--------------------------------|----------------------------------------------|
| **Blocking**           | Yes -- main conversation waits | No -- continue working                       |
| **Permission prompts** | Passed through to user         | Pre-approved upfront                         |
| **MCP tools**          | Available                      | Not available                                |
| **Resume**             | N/A                            | Can resume in foreground if permissions fail |

Set `run_in_background: true` on the Task tool to run in the background. Press `Ctrl+B` to background a running foreground task.

---

## Persistent Memory

Enable cross-session learning by setting the `memory` field:

| Scope     | Storage Location                           | Shared?                              |
|-----------|--------------------------------------------|--------------------------------------|
| `user`    | `~/.claude/agent-memory/<agent-name>/`     | Across all projects                  |
| `project` | `.claude/agent-memory/<agent-name>/`       | Project-specific, version-controlled |
| `local`   | `.claude/agent-memory-local/<agent-name>/` | Project-specific, local only         |

When enabled, the first 200 lines of `MEMORY.md` are injected into the subagent's context at startup. Read, Write, and Edit tools are auto-enabled for memory management.

---

## Hooks

### Scoped to a Subagent

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh"
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - type: command
          command: "./scripts/run-linter.sh"
```

### Project-Level Subagent Lifecycle Hooks

In `settings.json`:

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "db-agent",
        "hooks": [
          { "type": "command", "command": "./scripts/setup-db-connection.sh" }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          { "type": "command", "command": "./scripts/cleanup-db-connection.sh" }
        ]
      }
    ]
  }
}
```

---

## Best Practices

1. **One job per subagent.** Keep them focused. A code reviewer should not also run tests.
2. **Write precise descriptions.** Claude uses these to decide when to delegate automatically. Include phrases like "use proactively" to encourage automatic delegation.
3. **Grant minimal tool access.** Only the tools the subagent actually needs. Reduces risk and keeps focus.
4. **Match model to complexity.** Haiku for simple/high-volume, Sonnet for most tasks, Opus for complex reasoning.
5. **Parallelize independent work.** Spawn multiple subagents in a single message when their tasks are independent.
6. **Check project agents into version control.** Share `.claude/agents/` with your team.
7. **Isolate verbose operations.** Tests, log processing, and documentation searches are ideal subagent tasks.
8. **Chain from main conversation.** Since subagents cannot nest, orchestrate multi-step workflows from the main thread.

---

## Common Tool Combinations

| Use Case            | Tools                                   | Notes                          |
|---------------------|-----------------------------------------|--------------------------------|
| Read-only analysis  | `Read`, `Grep`, `Glob`                  | No modification or execution   |
| Test execution      | `Bash`, `Read`, `Grep`                  | Run commands, analyze output   |
| Code modification   | `Read`, `Edit`, `Write`, `Grep`, `Glob` | Full read/write, no shell      |
| Full access         | Omit `tools` field                      | Inherits all parent tools      |
| DB query validation | `Bash` + `PreToolUse` hook              | Block writes, allow reads only |

---

## Resuming Subagents

Each Task tool invocation returns an agent ID. Pass this ID via the `resume` parameter to continue with full prior context preserved.

Transcripts are stored at `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`.

---

## Troubleshooting

| Problem                             | Fix                                                                                              |
|-------------------------------------|--------------------------------------------------------------------------------------------------|
| Claude not delegating to subagents  | Ensure `Task` is in `allowedTools`; mention the subagent explicitly; improve description clarity |
| File-based agents not loading       | Agents load at startup only -- restart session or use `/agents`                                  |
| Background task permission failures | Resume in foreground; or pre-approve permissions                                                 |
| Long prompt failures on Windows     | Command line limit is 8191 chars -- use file-based agents instead of CLI flag                    |

---

## Sources

- [Claude Code Subagents Documentation](https://docs.anthropic.com/en/docs/claude-code/sub-agents)
- [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/agent-sdk)
- [Claude Code Best Practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)
