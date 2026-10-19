# Expo's skills (copied)

These are Expo's official Claude Code skills, copied from
[expo/skills](https://github.com/expo/skills) — `plugins/expo/skills` at
commit `7ddc1f5` (plugin 1.13.10). MIT, see `LICENSE`. They are copied rather
than installed as the `expo@claude-plugins-official` plugin on purpose: the
plugin also registers the Expo MCP server and a usage-telemetry hook, and this
project uses neither.

## Refresh them on every template release

Copies don't update themselves. Each time this template is released, pull the
latest from expo/skills and re-apply the same edits:

1. Clone `https://github.com/expo/skills` (shallow is fine) and replace every
   folder here with `plugins/expo/skills/<name>`. Keep `LICENSE` current.
2. Leave out `expo-skill-feedback` (feedback + telemetry) and `eas-simulator`
   (drives remote simulators over an MCP server).
3. Strip the trailing `## Submitting Feedback` section from every `SKILL.md`,
   and delete the `expo-skill-feedback` and `eas-simulator` lines from
   `expo-overview/SKILL.md`'s list.
4. Check nothing points back: `grep -rnE --include=SKILL.md 'submit-expo-feedback|expo-skill-feedback|eas-simulator|mcp\.expo' .claude/skills`
   prints nothing.
5. Update the commit and plugin version above and in `CLAUDE.md`, and note any
   skills Expo added or removed in the release commit.
