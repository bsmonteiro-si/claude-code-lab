# Plan Mode vs Plan Subagent

**No, they're not the same thing.** They work together but serve different purposes.

## Plan Mode (Shift+Tab)

A **permission mode** applied to your main conversation. It restricts Claude to read-only operations — no file edits, no writes. You toggle it by cycling through modes with Shift+Tab (`default` → `acceptEdits` → `plan`).

- Runs in the **main conversation context**
- You interact with it directly
- It's a safety constraint: "explore and plan, but don't touch anything"

## Plan Subagent (Task tool)

A **specialized subagent** that Claude spawns internally to do focused research. It runs in an **isolated context window**, gathers information, and returns a summary back to the main conversation.

- Runs in its **own separate context**
- Claude delegates to it automatically — you don't see the intermediate work
- It's a delegation mechanism: "go research this and bring me back findings"

## How They Connect

When you're in Plan Mode and ask something like "analyze our auth system and plan a migration to OAuth2", Claude may internally spawn a Plan subagent to do the heavy research. The subagent reads files and searches the codebase in isolation, then returns a summary. Claude (still in Plan Mode in the main conversation) uses that summary to present you a plan.

|                  | Plan Mode                   | Plan Subagent                         |
|------------------|-----------------------------|---------------------------------------|
| **What**         | Permission mode             | Isolated research assistant           |
| **Context**      | Main conversation           | Separate window                       |
| **Activated by** | You (Shift+Tab)             | Claude automatically, during planning |
| **Purpose**      | Safe exploration constraint | Efficient focused research            |

So Plan Mode is *where* you work; the Plan subagent is a *helper* Claude can dispatch while you're there.
