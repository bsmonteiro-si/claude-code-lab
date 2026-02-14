---
name: frontend
description: Delegate a task to the frontend engineer
disable-model-invocation: true
context: fork
argument-hint: [task description]
hooks:
  Stop:
    - hooks:
        - type: command
          command: "cd \"$CLAUDE_PROJECT_DIR/frontend\" && npm run test && npm run lint"
          timeout: 120
          statusMessage: "Running frontend tests and lint..."
---

!`cat .claude/agents/frontend-engineer.md`

$ARGUMENTS
