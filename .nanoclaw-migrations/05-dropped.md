# Dropped / Not Ported

The following v1-fork customizations are intentionally **not** being carried forward to v2. If any of these become important later, they'd need a fresh design against the v2 architecture.

## WhatsApp channel (entirely)

User decided: Slack-only on v2.

**Dropped files:**
- `src/channels/whatsapp.ts`
- `src/channels/whatsapp.test.ts`
- `setup/whatsapp-auth.ts`
- The `import './whatsapp.js'` (if present) in `src/channels/index.ts`
- The `register('whatsapp-auth', ...)` call in `setup/index.ts`

**Dropped dependencies:**
- `@types/qrcode-terminal` (was a dev dep for WhatsApp QR login)
- Any Baileys / whatsapp-web.js runtime deps if present

**Dropped remote:** The `whatsapp` git remote (`https://github.com/qwibitai/nanoclaw-whatsapp.git`) can be removed after migration:
```bash
git remote remove whatsapp
```

## `.github/workflows/fork-sync-skills.yml`

This is the workflow that produced the failing Action run the user originally asked about. It does auto-upstream-merge + merge-forward into skill branches, which fundamentally can't work across the v1→v2 rewrite (and likely can't work across any future breaking upstream change either).

**Action:** delete the file. Future upgrades go through `/migrate-nanoclaw` (this skill), triggered manually.

```bash
rm .github/workflows/fork-sync-skills.yml
```

## IPC files (gone from upstream)

The v1 fork had local modifications to these files; upstream deleted them as part of the v2 rewrite (the two-DB session split replaces the IPC watcher concept):

- `src/ipc.ts`
- `src/ipc-auth.test.ts`
- `container/agent-runner/src/ipc-mcp-stdio.ts`

**Action:** do not port. The v2 equivalent is the host ↔ container DB handoff in `src/session-manager.ts` + the agent-runner poll loop.

## `src/container-runner.ts` credential-injection patch

The v1 fork patched this file to set `ATLAS_API_TOKEN`, `ATLAS_API_URL`, `GEMINI_API_KEY` as env vars passed into every container, plus mounted `~/.config/gws/` and `~/credentials.json`.

**Action:** do not port. v2 uses OneCLI for request-time credential injection (see `03-credentials.md`) — putting credentials in container env vars is explicitly against v2 conventions and would defeat the isolation model.

## `src/index.ts` `sendImage()` + `src/types.ts` `Channel.sendImage`

The v1 fork extended the Channel interface with `sendImage?()` and added a harness-level `sendImage()` that dispatched to whichever channel advertised the capability, used by the gemini-image `--send` flow and by a vision skill.

**Action:** do not port this exact signature. In v2, channel adapters are Chat SDK-based and the outbound payload format includes attachments natively (text + image + file). Verify this by reading the v2 Chat SDK bridge (`src/channels/` in upstream) before deciding how the gemini-image `--send` flow delivers images — see `02-custom-skills.md` for the two options.

## atlas-README.md multi-user gws plan

The v1 fork documented (but never implemented) a multi-user gws credential pattern: mount `~/.config/gws-users/duane/` vs `~/.config/gws-users/partner/` and swap before each gws command based on the Slack sender.

**Action:** do not port. v2 natively supports multi-tenancy via agent-groups — different agent-groups get different credential bundles via OneCLI. If multi-user gws is still wanted on v2, design it as "two agent-groups, each with its own OneCLI-injected gws credentials."

Keep `atlas-README.md` in `/tmp` or a note if you want the requirements recorded for later, but do not put it back into the v2 tree.

## `src/channels/index.ts` slack import line

The v1 fork added `import './slack.js';` to wire up the hand-written Slack adapter. v2 uses the Chat SDK bridge for channel adapters — `/add-slack` handles registration itself.

**Action:** do not port. Trust `/add-slack`.

## `container/skills/pdf-reader/` (the fork-shipped copy)

The v1 fork had a copy of the pdf-reader skill as a directory. On v2, `/add-pdf-reader` lays down the current upstream version.

**Action:** do not copy the v1 directory over. Trust the installer.

## Formatting-only commits

Several commits (`be12c57`, `d3b3926`) are pure formatting passes on v1 files. Since the files themselves don't carry forward intact, the formatting doesn't either.

**Action:** nothing to do.
