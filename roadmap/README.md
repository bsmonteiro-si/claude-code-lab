# Product Roadmap

## Where We Are

LLM Prompt Lab is a working prompt engineering platform with three core capabilities: template management with automatic versioning, multi-step pipeline execution with output chaining, and full execution history tracking. Two LLM providers are supported (Anthropic and OpenAI).

The product is functional but early. It operates as a single-user, anonymous environment with no authentication, no search or organization tools, and limited control over model behavior. The iteration workflow — the thing prompt engineers do most — requires too many clicks and too much context-switching.

## Where We're Going

The roadmap is organized into three epics, ordered by dependency and impact.

### Epic 1: User Authentication

**Goal:** Establish user identity so that every piece of work belongs to someone.

This comes first because every subsequent epic assumes a current user exists. Organization and navigation features are user-scoped (my templates, my tags, my dashboard). Building those features without auth means retrofitting ownership later — a rework we'd rather avoid.

**Scope:** User accounts, login, session management, data ownership, and an authenticated frontend experience. Intentionally excludes password reset, email verification, OAuth, roles, and teams.

**[Full epic →](epic-user-authentication.md)**

---

### Epic 2: Prompt Iteration Loop

**Goal:** Speed up the core workflow — tweak, re-run, compare — so that iterating on a prompt takes seconds instead of minutes.

This is the highest-impact epic for daily users. Today, each iteration cycle involves navigating between pages, re-filling inputs, and mentally holding previous outputs. This epic eliminates that friction with model parameter controls, system prompts, one-click re-execution, side-by-side comparison, and version diffing.

**Scope:** Five features spanning model parameters, system prompt support, re-run mechanics, output comparison, and version history visualization.

**[Full epic →](epic-iteration-loop.md)**

---

### Epic 3: Organization & Navigation

**Goal:** Give users the tools to find, group, and navigate their work as it grows.

As the iteration loop gets faster, users produce more templates and more executions. Without organization tools, the product buckles under its own success. This epic introduces search, tags, a useful home dashboard, filtered execution history, and template cross-references.

**Scope:** Five features spanning search, tagging, dashboard, execution filtering, and dependency visibility.

**[Full epic →](epic-organization-navigation.md)**

---

## Epic Sequencing

```
Epic 1: User Authentication
  └── Epic 2: Prompt Iteration Loop
  └── Epic 3: Organization & Navigation
```

Epic 1 is a prerequisite for Epics 2 and 3 — both need a current user in the system. Epics 2 and 3 are independent of each other and can be built in parallel once auth is in place, though the iteration loop is higher priority since it directly improves the core workflow.

Within each epic, features are phased internally (see individual epic documents for build order). This allows engineers to ship incrementally rather than waiting for an entire epic to complete.

## What's Deferred

The following themes were identified during roadmap planning but intentionally left for a future cycle:

- **Execution Intelligence** — metrics, cost tracking, latency analysis, lightweight evaluation scoring. Becomes valuable once users have enough execution history to analyze, which the first three epics will generate.
- **Collaboration** — sharing templates between users, team workspaces, shared tag taxonomies. Requires auth to be mature and a clear multi-user use case to emerge.
- **Advanced Organization** — folders, nested hierarchies, saved searches, custom views. Tags and search cover the 80% case. Revisit if users outgrow them.
- **Additional Providers** — Google, Cohere, local models. The provider strategy pattern makes this straightforward to add, but it's additive rather than foundational.
