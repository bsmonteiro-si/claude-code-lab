#!/bin/bash

INPUT=$(cat)

AGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // empty')
AGENT_ID=$(echo "$INPUT" | jq -r '.agent_id // empty')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')

DATE_SLUG=$(date +%Y-%m-%d)
SHORT_ID=$(echo "$SESSION_ID" | cut -c1-8)

if [ -n "$AGENT_TYPE" ]; then
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.agent_transcript_path // empty')
  EXPORT_DIR="$CLAUDE_PROJECT_DIR/.claude/transcripts/subagents"
  SHORT_AGENT_ID=$(echo "$AGENT_ID" | cut -c1-8)
  FILENAME="${DATE_SLUG}-subagent-${AGENT_TYPE}-${SHORT_AGENT_ID}.md"
  TITLE="$DATE_SLUG — Subagent Transcript: $AGENT_TYPE"
  HEADER="**Agent:** $AGENT_TYPE\n**Agent ID:** $AGENT_ID\n**Parent Session:** $SESSION_ID"
else
  TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')
  EXPORT_DIR="$CLAUDE_PROJECT_DIR/.claude/transcripts"
  FILENAME="${DATE_SLUG}-transcript-${SHORT_ID}.md"
  TITLE="$DATE_SLUG — Claude Code Session"
  HEADER="**Session:** $SESSION_ID"
fi

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  exit 0
fi

mkdir -p "$EXPORT_DIR"
EXPORT_FILE="$EXPORT_DIR/$FILENAME"

strip_ansi() {
  sed 's/\x1b\[[0-9;]*[a-zA-Z]//g' | sed 's/\x1b\[[0-9;]*m//g'
}

classify_user_message() {
  local text="$1"
  case "$text" in
    *"<command-name>"*"<command-message>"*)  echo "Slash Command" ;;
    "<local-command-stdout>"*)               echo "Command Output" ;;
    "<local-command-caveat>"*)               echo "SKIP" ;;
    "<system-reminder>"*)                    echo "SKIP" ;;
    "<bash-input>"*)                         echo "Bash Input" ;;
    "<bash-stdout>"*|"<bash-stderr>"*)       echo "Bash Output" ;;
    "<ide_opened_file>"*|"<ide_selection>"*) echo "IDE Notification" ;;
    "<user-memory-input>"*)                  echo "User Memory" ;;
    "This session is being continued from a previous conversation"*) echo "Session Summary" ;;
    *)                                       echo "User" ;;
  esac
}

{
  echo "# $TITLE"
  echo ""
  echo "**Date:** $(date '+%Y-%m-%d %H:%M:%S')"
  echo -e "$HEADER"
  echo ""
  echo "---"
  echo ""

  while IFS= read -r line; do
    msg_type=$(echo "$line" | jq -r '.type // empty')
    role=$(echo "$line" | jq -r '.message.role // empty')

    if [ "$msg_type" = "user" ] && [ "$role" = "user" ]; then
      content=$(echo "$line" | jq -r '
        if (.message.content | type) == "string" then
          .message.content
        elif (.message.content | type) == "array" then
          [.message.content[] | select(.type == "text") | .text] | join("\n")
        else
          empty
        end // empty
      ')
      if [ -z "$content" ]; then
        continue
      fi

      label=$(classify_user_message "$content")
      if [ "$label" = "SKIP" ]; then
        continue
      fi

      echo "## $label"
      echo ""
      echo "$content" | strip_ansi
      echo ""
      echo "---"
      echo ""

    elif [ "$msg_type" = "assistant" ] && [ "$role" = "assistant" ]; then
      text_content=$(echo "$line" | jq -r '
        [.message.content[]
          | select(.type == "text")
          | .text
        ] | join("\n") // empty
      ')
      tool_uses=$(echo "$line" | jq -r '
        [.message.content[]
          | select(.type == "tool_use")
          | "- **" + .name + "**: `" + (.input | tostring | .[0:200]) + "`"
        ] | join("\n") // empty
      ')

      if [ -n "$text_content" ] || [ -n "$tool_uses" ]; then
        echo "## Assistant"
        echo ""
        if [ -n "$text_content" ]; then
          echo "$text_content" | strip_ansi
          echo ""
        fi
        if [ -n "$tool_uses" ]; then
          echo "### Tool Calls"
          echo ""
          echo "$tool_uses"
          echo ""
        fi
        echo "---"
        echo ""
      fi
    fi
  done < "$TRANSCRIPT_PATH"
} > "$EXPORT_FILE"

exit 0
