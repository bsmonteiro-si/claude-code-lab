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
