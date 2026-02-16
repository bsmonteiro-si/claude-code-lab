---
name: ship
description: Stage, commit, and push all changes with an auto-generated meaningful commit message
argument-hint: [optional message override or extra context]
---

# Ship Changes

Stage all changes, generate a meaningful commit message from the diff, commit, and push.

## Steps

1. **Inspect changes** — Run these in parallel:
   - `git status` to see all modified and untracked files
   - `git diff` and `git diff --cached` to see the actual changes
   - `git log --oneline -5` to see recent commit message style

2. **Decide what to stage** — Stage all modified and new files that are part of the work. Never stage files that contain secrets (`.env`, credentials, API keys). If unsure about a file, ask the user.

3. **Generate the commit message** — Analyze the staged diff and write a message that:
   - Has a concise subject line (under 72 characters) in imperative mood
   - Summarizes the **why**, not just the **what**
   - Adds a body (separated by a blank line) with more detail when the change spans multiple concerns
   - Never mentions Claude, Claude Code, AI, LLM assistance, or any co-author attribution
   - Follows the tone and style of recent commits in the repository

4. **Commit** — Use a HEREDOC to pass the message:
   ```bash
   git commit -m "$(cat <<'EOF'
   Subject line here

   Optional body here.
   EOF
   )"
   ```

5. **Push** — Run `git push`. If the branch has no upstream, use `git push -u origin <branch>`.

6. **Verify** — Run `git status` to confirm a clean working tree.

## Message Style Guide

- **New feature:** `Add user authentication with JWT tokens`
- **Enhancement:** `Update pipeline executor to support variable chaining`
- **Bug fix:** `Fix cascade delete failing on pipelines with executions`
- **Refactor:** `Extract template versioning into dedicated service`
- **Tests:** `Add E2E auth tests and pipeline flow coverage`
- **Docs:** `Document development workflow and Playwright test commands`
- **Multi-concern:** Use a subject that captures the theme, then list specifics in the body

## Rules

- Never force push to main/master.
- Never commit `.env`, credentials, or secrets.
- If there are no changes to commit, say so and stop.
- If the user provides `$ARGUMENTS`, use it as the commit message subject or as context for generating one.

$ARGUMENTS
