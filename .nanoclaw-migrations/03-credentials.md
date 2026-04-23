# Credentials — OneCLI migration

All application-level credentials move from `.env` + file mounts to the OneCLI vault. In v2, the host calls `onecli.ensureAgent()` + OneCLI injects secrets into container requests at runtime, so nothing sensitive sits in the image, env file, or the container's shell environment at rest.

## Credentials to register

After `/init-onecli` has been run (or if OneCLI is already initialized), add these secrets:

### Atlas platform (atlas skill)
- `ATLAS_API_TOKEN` — admin JWT (non-expiring). Copy verbatim from current `.env`.
- `ATLAS_API_URL` — base URL (e.g. `https://api.atlascdt.com`). Technically a URL not a secret, but register it as a config value in the same vault for cohesion.

Host pattern: match against `*api.atlascdt.com*` (so OneCLI injects only on requests to Atlas).

### Gemini (gemini-image skill)
- `GEMINI_API_KEY` — Google AI Studio API key.

Host pattern: match against `*generativelanguage.googleapis.com*`.

### Google Workspace (gws skill)

Two reasonable patterns — pick one:

**Pattern A: token-string in OneCLI.** Export the current gws token and register:
- `GOOGLE_WORKSPACE_CLI_TOKEN` — opaque token string the `gws` CLI accepts.

Host pattern: match against `*googleapis.com*`.

**Pattern B: credentials-file in OneCLI.** Register the full credentials JSON as a secret, have OneCLI write it to a temp path, and set:
- `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` — path to the temp-written file.

Pattern A is simpler if the token format allows it. Pattern B matches what the v1 fork was doing (file-mount of `~/credentials.json`) and keeps any refresh-token logic intact.

## Agent-group secret mode gotcha

v2's `container-runner.ts` creates new agent groups in **`selective`** secret mode via `POST /api/agents` — meaning **no secrets are attached by default** even if they exist in the vault with matching host patterns.

**After migration, for each agent-group that needs these credentials:**
1. Either set the agent's secret mode to `all` (inherits all vault secrets matching host patterns), or
2. Explicitly assign the Atlas / Gemini / GWS secrets to the agent.

Check v2's OneCLI docs (`onecli --help` or `src/onecli-approvals.ts`) for the exact CLI for this. The upstream CLAUDE.md for v2 flags this gotcha around line 102–104.

## Migration steps

1. In the v2 worktree, run `/init-onecli` if not already done.

2. For each credential above, use the OneCLI skill / CLI to register it. The simplest path: copy from v1 `.env` then `onecli secret add <name> --value "$(grep ^<NAME>= .env | cut -d= -f2-)"` (or whatever v2's CLI syntax is).

3. Set host patterns so each secret is injected only on requests to its real API endpoint — prevents leaking Atlas tokens to Google endpoints etc.

4. Confirm the agent-group is in the right secret mode (see gotcha above).

5. Remove the same variables from `.env` **only after** confirming v2 picks them up via OneCLI — keep the `.env` copy as a fallback until you've run a live test.

## NOT migrating to OneCLI

- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` — these are messaging-platform credentials owned by the Slack channel adapter, not agent-accessible secrets. They live in host `.env`.
- `NANOCLAW_CHAT_JID`, `NANOCLAW_GROUP_FOLDER` — v1 container-runtime context; v2 provides equivalents implicitly via the session model.
