# Custom Container Skills

All four are fork-unique (no upstream equivalent). Copy each directory from the v1 main tree into the v2 worktree at `container/skills/<name>/`. Scope: container-wide (mounted into every agent-group session).

**v2 placement note:** In v2, `container/skills/` contains skills mounted into every session container. `groups/<agent-group>/skills/` contains per-agent-group skills. The user chose container-wide scope for all four, so they go under `container/skills/`.

## atlas — Atlas platform HTTP API

**Intent:** Teach the agent how to query the Atlas real-estate platform (MLS, exclusive listings, appointments, inquiries) and the Quo SMS/call system used by the brokerage.

**Files:** `container/skills/atlas/SKILL.md` only (documentation; no scripts).

**How to apply:**

1. Copy as-is:
   ```bash
   cp -r "$PROJECT_ROOT/container/skills/atlas" "$WORKTREE/container/skills/atlas"
   ```

2. Ensure these env vars are resolvable inside agent containers (via OneCLI — see `03-credentials.md`):
   - `ATLAS_API_TOKEN` — admin JWT
   - `ATLAS_API_URL` — base URL (e.g. `https://api.atlascdt.com`)

3. No code changes needed. The SKILL.md teaches agents to shell out with `curl` and `jq`.

**Domain-specific content baked in (keep as-is):**
- Quo phone default: `+19143713355`
- Pipeline stages: `new_inquiry`, `contacted`, `engaged`, `showing_scheduled`, `showing_completed`, `feedback_received`, `offer_pending`, `passed`, `nurture`, `lost`
- Client/agent role model: BUYER / SELLER / RENTER / LANDLORD
- Status codes: APPT_SCHEDULED, APPOINTMENT_CONFIRMED, AWAITING_AGENT_RESPONSE, AGENT_NEW_TIME_PROPOSAL, AGENT_CANCELS, CLIENT_CANCELS, VIEWING_COMPLETED, AGENT_NO_SHOW, CLIENT_NO_SHOW

## gws — Google Workspace CLI

**Intent:** Teach the agent to read Gmail, manage Calendar, manipulate Drive/Sheets via the authenticated `gws` CLI.

**Files:** `container/skills/gws/SKILL.md` only.

**How to apply:**

1. Copy as-is:
   ```bash
   cp -r "$PROJECT_ROOT/container/skills/gws" "$WORKTREE/container/skills/gws"
   ```

2. Install `@googleworkspace/cli` globally in the container — handled in `04-dockerfile.md`.

3. Credential handling — OneCLI path (see `03-credentials.md`). The gws CLI's default credential lookup order is:
   1. `GOOGLE_WORKSPACE_CLI_TOKEN` env var
   2. `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` env var
   3. `~/.config/gws/credentials.enc`
   4. `~/.config/gws/credentials.json`

   Choose #1 or #2 for OneCLI integration (inject token/filepath at request time) rather than baking credentials into the container image.

**Multi-user TODO (deferred):** atlas-README.md in the v1 tree described a plan for mounting per-user credentials at `~/.config/gws-users/<user>/credentials.json` and swapping before each command based on the Slack sender. This was never wired. In v2 this is handled natively by agent-group isolation — different agent-groups get different credential bundles via OneCLI. Revisit after upgrade; do not port the v1 plan.

## gemini-image — Google Gemini image generator

**Intent:** Generate images from text prompts and deliver them back to chat.

**Files:**
- `container/skills/gemini-image/SKILL.md`
- `container/skills/gemini-image/gemini-image` (bash executable, ~5.7 KB)

**How to apply:**

1. Copy the directory:
   ```bash
   cp -r "$PROJECT_ROOT/container/skills/gemini-image" "$WORKTREE/container/skills/gemini-image"
   ```

2. Install the binary globally in the container — handled in `04-dockerfile.md` (it used to live in `/usr/local/bin/gemini-image`).

3. Ensure `GEMINI_API_KEY` is resolvable inside agent containers (via OneCLI — see `03-credentials.md`).

4. **⚠ v2 adaptation required.** The `gemini-image` script's `--send` flag writes a JSON descriptor to `/workspace/ipc/messages/` and an image file to `/workspace/ipc/images/`. That IPC directory pattern is v1. In v2, the agent-runner delivers outbound payloads via `outbound.db` (message type with attachment), not file drops.

   **Two options:**
   - **(Preferred)** Rewrite the `--send` branch of the script to insert a row into `outbound.db` with the generated image path. Reference `container/agent-runner/src/` in the v2 tree for how formatter / destinations handle outbound attachments.
   - **(Simpler fallback)** Remove the `--send` flag entirely; have the agent invoke the script without `--send`, capture the output path from stdout, and attach the file through whatever the v2 agent-runner exposes for outbound images (likely a message with an attachment field).

   Verify by generating one image and confirming it shows up in Slack.

5. NANOCLAW_CHAT_JID / NANOCLAW_GROUP_FOLDER env vars: these are v1 conventions. If the `--send` rewrite uses them, map to their v2 equivalents (`agent_group_id`, `session_id`, or the session root under `data/v2-sessions/<session_id>/`).

## wiki — Karpathy-style brokerage wiki

**Intent:** Persistent markdown knowledge base for the real-estate brokerage (NYC + Nashville): market data, neighborhoods, buildings, regulations, cap rates, 1031 exchanges, zoning. Agent-operated (no MCP server, no slash commands).

**Files:** `container/skills/wiki/SKILL.md` only.

**How to apply:**

1. Copy as-is:
   ```bash
   cp -r "$PROJECT_ROOT/container/skills/wiki" "$WORKTREE/container/skills/wiki"
   ```

2. No credentials required.

3. **Data location:** The skill's operational manual references `wiki/` as the markdown root. On v1, this was a group-folder convention under `groups/<group>/wiki/`. In v2 with container-wide scope, each agent-group's session gets its own working directory — the `wiki/` folder will be per-session unless you symlink it somewhere shared.

   **Decision point during upgrade:** where should the wiki live?
   - If you want ONE shared wiki across all agent-groups: create a persistent host directory and mount it into every session. Probably `groups/_shared/wiki/` with a container-runner mount rule.
   - If each agent-group should have its own wiki: leave it in the session cwd — existing behavior.

   Default to agent-group-scoped (per-agent-group `wiki/`) unless you say otherwise; it's the v2-idiomatic choice.

4. Optional integrations baked into SKILL.md:
   - Calls `agent-browser` skill for dynamic URL extraction — works if `/add-agent-browser` (or its v2 equivalent) is installed.
   - Calls `pdf-reader` skill — works after `01-applied-skills.md` step 2.

**Domain content baked in (keep as-is):** NYC + Nashville scope, neighborhood entries, regulation templates, market-summary format.
