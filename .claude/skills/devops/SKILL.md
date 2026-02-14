---
name: devops
description: Delegate a task to the devops engineer
disable-model-invocation: true
context: fork
argument-hint: [task description]
hooks:
  Stop:
    - hooks:
        - type: command
          command: "cd \"$CLAUDE_PROJECT_DIR\" && docker compose config --quiet"
          timeout: 30
          statusMessage: "Validating docker-compose..."
---

!`cat .claude/agents/devops-engineer.md`

$ARGUMENTS
