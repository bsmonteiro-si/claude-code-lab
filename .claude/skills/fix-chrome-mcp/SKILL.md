---
name: fix-chrome-mcp
description: Diagnose and fix Claude in Chrome MCP connection issues when browser tools return "No Chrome extension connected"
allowed-tools: Bash(ps *), Bash(kill *), Bash(ls *), Bash(lsof *), Bash(python3 *), Bash(rm *), Read, Grep
---

# Fix Claude in Chrome MCP Connection

When `mcp__claude-in-chrome__tabs_context_mcp` returns "No Chrome extension connected", run through these diagnostic steps in order. Stop at the first step that resolves the issue.

## Step 1: Verify the MCP tools exist in this session

Call `mcp__claude-in-chrome__tabs_context_mcp` with `createIfEmpty: true`.

- If the tool is not available (`No such tool available`), the MCP server is not running for this session. Inform the user they need to restart Claude Code — there is no way to reconnect a dead MCP server mid-session.
- If it returns tab data, the connection is working. Done.
- If it returns "No Chrome extension connected", continue to Step 2.

## Step 2: Check the `tengu_copper_bridge` feature flag

This is the most common cause. A GrowthBook feature flag forces the MCP to route through a cloud WebSocket bridge instead of the local Unix socket. The cloud bridge has an OAuth/session mismatch bug.

Read `~/.claude.json` and check `cachedGrowthBookFeatures.tengu_copper_bridge`.

If it is `true`, set it to `false`:

```bash
python3 -c "
import json
with open('$HOME/.claude.json', 'r') as f:
    data = json.load(f)
data['cachedGrowthBookFeatures']['tengu_copper_bridge'] = False
with open('$HOME/.claude.json', 'w') as f:
    json.dump(data, f, indent=2)
print('Fixed: tengu_copper_bridge set to false')
"
```

Inform the user:
- The flag may re-cache to `true` periodically from Anthropic's servers. Run this skill again if the error returns.
- A session restart is required for this change to take effect.

## Step 3: Check for stale or duplicate MCP processes

```bash
ps aux | grep "claude-in-chrome-mcp\|chrome-native-host" | grep -v grep
```

Look for:
- **Multiple `--claude-in-chrome-mcp` processes**: Two MCP servers can conflict. Kill the older one.
- **A `--chrome-native-host` process with no socket connections**: The native host may be orphaned.

Check the browser bridge socket directory:

```bash
ls -la /tmp/claude-mcp-browser-bridge-$(whoami)/ 2>/dev/null
```

Then verify the socket has active connections:

```bash
lsof /tmp/claude-mcp-browser-bridge-$(whoami)/*.sock 2>/dev/null
```

If the native host socket exists but no MCP server is connected to it, this confirms a broken connection. Kill all stale processes:

```bash
pkill -f "claude-in-chrome-mcp|chrome-native-host"
rm -rf /tmp/claude-mcp-browser-bridge-$(whoami)/
```

After killing processes, the MCP tools will disappear from the current session. A restart is required.

## Step 4: Verify Chrome native messaging host

```bash
cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.anthropic.claude_code_browser_extension.json
```

Verify:
- The `path` field points to an existing, executable file.
- The `allowed_origins` contains the correct Chrome extension ID.

Check the native host script:

```bash
cat ~/.claude/chrome/chrome-native-host
ls -la ~/.claude/chrome/chrome-native-host
```

Verify:
- The script exists and is executable (`-rwxr-xr-x`).
- The `exec` line points to a valid `node` binary and `cli.js` path.

## Step 5: Check Chrome extension version

```bash
ls -lt ~/Library/Application\ Support/Google/Chrome/Default/Extensions/fcoeoabgfenejglbffodgkkbkcdhcgfn/ 2>/dev/null
```

If the directory does not exist, the Chrome extension is not installed. Tell the user to install "Claude" from the Chrome Web Store.

## Resolution Summary

After completing diagnostics, tell the user:
1. What was wrong (root cause).
2. What was fixed.
3. Whether a session restart is needed (it almost always is).
4. Reference: https://github.com/anthropics/claude-code/issues/24935
