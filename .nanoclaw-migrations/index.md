# NanoClaw Migration Guide — realcdt/nanoclaw v1.2.53 → upstream v2

Generated: 2026-04-23
Base (merge-base with upstream/main): `eba94b7`
HEAD at generation: `4aa18cd`
Upstream target: `8326b4c` (v2.0.2)

This fork diverged from upstream at `eba94b7` (v1.2.53 era) and upstream has since shipped a ground-up v2 rewrite (two-DB session split, entity model, OneCLI-injected credentials, channels-as-skills, providers-as-skills). A merge is not viable — customizations must be **reapplied** onto a clean v2 checkout.

## Migration Plan

**Order of operations (Tier 3):**

1. **Upstream skills first** — in a worktree on `upstream/main`, run the upstream skill installers: `/add-slack`, `/add-pdf-reader`. These replace the fork's hand-maintained Slack/PDF code with v2-native adapters. See `01-applied-skills.md`.

2. **OneCLI setup** — migrate these credentials into the OneCLI vault: `ATLAS_API_TOKEN`, `ATLAS_API_URL`, `GEMINI_API_KEY`, Google Workspace credentials. In v2 these are injected at request time, not passed via env vars. See `03-credentials.md`.

3. **Custom container skills** — copy `container/skills/atlas/`, `container/skills/gws/`, `container/skills/gemini-image/`, `container/skills/wiki/` into the v2 tree under `container/skills/` (container-wide so every agent-group mounts them). Minor adaptations needed for gemini-image (its `/workspace/ipc/messages` IPC path is v1; v2 delivers via `outbound.db`). See `02-custom-skills.md`.

4. **Dockerfile base deps** — add `jq` and `poppler-utils` + `@googleworkspace/cli` global install to the v2 `container/Dockerfile`. The per-skill CLI installs (`pdf-reader`, `gemini-image`) are handled by steps 1/3 respectively. See `04-dockerfile.md`.

5. **Validate and swap** — `npm install && npm run build && npm test` in the worktree, optional live test, then `git reset --hard` the worktree HEAD.

**Stages / validation gates:**
- After step 1: worktree builds cleanly with Slack + PDF reader skills.
- After step 3: agent-runner container builds; `atlas`, `gws`, `gemini-image`, `wiki` skills are visible inside session containers.
- After step 4: full test suite green.

**Risk areas:**
- **gemini-image IPC path** — script writes to `/workspace/ipc/messages` (v1 convention). v2 delivers via `outbound.db`. Will need a small shell wrapper or the script body updated to write into the new delivery mechanism. Flagged in `02-custom-skills.md`.
- **GWS multi-user pattern** (atlas-README.md's "mount per-user credential dirs at runtime" plan) — this was a v1 TODO and is not being ported. v2 has per-agent-group isolation which handles this natively; revisit post-upgrade.
- **src/container-runner.ts credential injection** — the fork patched this file to inject Atlas/Gemini/GWS env vars into containers. Do NOT port this patch to v2 — OneCLI does this natively. See `05-dropped.md`.
- **`sendImage` channel hook** — the fork added `sendImage?()` to the Channel interface in `src/types.ts` and wired it through `src/index.ts`. v2's channel adapter spec likely handles image payloads natively; verify the upstream interface covers it before porting. See `05-dropped.md`.

**Things NOT being ported** (see `05-dropped.md`):
- WhatsApp channel + QR auth + `@types/qrcode-terminal` dependency
- `.github/workflows/fork-sync-skills.yml` (auto-merge workflow — incompatible with intent-based migration)
- `src/ipc.ts`, `src/ipc-auth.test.ts`, `container/agent-runner/src/ipc-mcp-stdio.ts` (v1 IPC concept replaced by two-DB split upstream)

## Applied Skills (upstream-origin, reapply via installer)

See `01-applied-skills.md`.

- **Slack** → `/add-slack` in worktree
- **PDF reader** → `/add-pdf-reader` in worktree

## Custom Skills (fork-unique, copy as-is)

See `02-custom-skills.md`.

- **atlas** — real-estate platform HTTP API cheatsheet (SKILL.md only)
- **gws** — Google Workspace CLI usage (SKILL.md only)
- **gemini-image** — bash image generator (SKILL.md + `gemini-image` script; IPC path needs v2 adaptation)
- **wiki** — Karpathy-style brokerage knowledge base (SKILL.md only)

## Credentials (OneCLI-managed on v2)

See `03-credentials.md`.

## Dropped Files / Customizations

See `05-dropped.md`.

## Skill Interactions

None meaningful. The Slack channel and the four custom container skills are orthogonal. `wiki` optionally calls out to `pdf-reader` (from `/add-pdf-reader`) for PDF ingestion, which is a runtime integration, not a build-time interaction.
