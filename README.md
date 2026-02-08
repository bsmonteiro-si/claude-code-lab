# LLM Prompt Lab

A full-stack prompt engineering and AI pipeline platform. Build, execute, evaluate, and compare LLM workflows across multiple providers.

## Overview

LLM Prompt Lab lets you compose AI pipelines by chaining prompt templates, model calls, and evaluation steps into reusable workflows. Each step in a pipeline can use a different model, provider, or tool — giving you a single place to build, test, and iterate on complex LLM interactions.

## Tech Stack

- **Backend**: Python + FastAPI
- **Frontend**: React + TypeScript
- **Database**: PostgreSQL
- **LLM Providers**: Anthropic, OpenAI (extensible to others)

## MVP Scope

### Prompt Templates
- Create and manage prompt templates with `{{variable}}` placeholders
- Version history for each template
- Execute templates against any configured LLM provider

### Pipeline Engine
- Define multi-step pipelines where each step is an LLM call
- Output of one step feeds as input to the next
- Support for different models/providers per step

### Execution & Streaming
- Real-time streaming of LLM responses during execution
- Step-by-step progress tracking for pipeline runs
- Execution history with full input/output logs

### Model Comparison
- Run the same prompt or pipeline with different models
- Side-by-side output view

### Frontend
- Prompt template editor with variable highlighting
- Pipeline execution view with streaming output
- Model comparison side-by-side display
- Execution history browser

## Future Roadmap

- **Visual Pipeline Builder** — drag-and-drop canvas for composing pipeline nodes
- **Evaluation Center** — upload test datasets, run pipelines against them, score results with LLM-as-judge
- **Embeddings & Semantic Comparison** — use vector similarity to evaluate output quality across runs
- **Tool Use Nodes** — pipeline steps that leverage function calling (web search, DB queries, calculators)
- **Conditional Routing** — branch pipelines based on LLM classification output
- **Splitter/Aggregator Nodes** — parallel processing of chunked inputs with result aggregation
- **MCP Server** — expose the pipeline engine as an MCP server for use from Claude Code
- **Collaborative Workspaces** — share pipelines and templates across teams

## Project Structure

```
claude-code-lab/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # Route handlers
│   │   ├── core/     # Config, dependencies
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── engine/   # Pipeline execution engine
│   └── tests/
├── frontend/         # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/  # API clients
│   │   └── store/     # State management
│   └── tests/
└── .claude/          # Claude Code configuration
    ├── commands/     # Custom slash commands
    └── settings.local.json
```

## Getting Started

> Setup instructions will be added as the project scaffolding is built.
