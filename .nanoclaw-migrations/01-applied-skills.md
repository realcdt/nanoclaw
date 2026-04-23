# Applied Upstream Skills

These are reapplied by running the upstream v2 skill installers inside the upgrade worktree. Do NOT port the v1 source files directly (`src/channels/slack.ts`, `src/channels/slack.test.ts`, `container/skills/pdf-reader/`, etc.) — v2's versions live on different paths and use the Chat SDK bridge / the v2 container-skill scaffold.

## Slack

**Intent:** Slack is the primary (and now only) messaging channel. All chat with the agent goes through Slack Socket Mode.

**How to apply (in worktree):**

1. Run the upstream skill installer:
   ```bash
   cd "$WORKTREE" && /add-slack
   ```
   (Or: trigger the `add-slack` skill from a Claude session with CWD set to `$WORKTREE`.) The v2 installer creates the Chat SDK-based Slack adapter, wires channel registration, and installs `@slack/bolt` + `@slack/types` at upstream-pinned versions.

2. Credentials to configure (post-install):
   - `SLACK_BOT_TOKEN` — `xoxb-...`
   - `SLACK_APP_TOKEN` — `xapp-...` (Socket Mode)

   These go in `.env` unless you later choose to move them to OneCLI.

3. After install, the agent-group wiring is handled by the `/manage-channels` skill (v2-only). Run it to bind your Slack workspace/channels to the intended agent-group.

**NOT ported from v1 fork:**
- `src/channels/slack.ts`, `src/channels/slack.test.ts` — v2 adapter supersedes these.
- The direct `import './slack.js'` line the fork added to `src/channels/index.ts` — v2 auto-registers via the Chat SDK bridge.

## PDF Reader

**Intent:** Agents can extract text from PDFs sent as chat attachments (used by atlas for lease docs, by wiki for source PDFs).

**How to apply (in worktree):**

1. Run the upstream skill installer:
   ```bash
   cd "$WORKTREE" && /add-pdf-reader
   ```

2. The v1 fork relied on `pdftotext` from `poppler-utils` — confirm the v2 installer still adds that as a Dockerfile layer. If the v2 skill does NOT add it, add it manually per `04-dockerfile.md`.

3. No fork-specific customizations to the PDF reader behavior were made — the v1 install was stock-upstream.

**NOT ported from v1 fork:**
- `container/skills/pdf-reader/` directory — v2's installer lays down its own version.
- The `pdf-reader` binary copy step in `container/Dockerfile` — v2 handles this.
