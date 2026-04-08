# Atlas Integration Notes

## Multi-User Google Workspace (gws) Credentials

`gws` hardcodes its config to `~/.config/gws/` — no profile flag or env var override. In the container, this maps to `/home/node/.config/gws/`. To support multiple Google accounts (e.g. Duane + partner), we mount per-user credential directories and have the agent swap them at runtime.

### Setup

```bash
# Create per-user gws credential directories
mkdir -p ~/.config/gws-users/duane
mkdir -p ~/.config/gws-users/partner

# Copy existing credentials (Duane)
cp ~/.config/gws/* ~/.config/gws-users/duane/

# Auth as partner (requires their browser)
HOME=/tmp/partner-auth gws auth login
cp /tmp/partner-auth/.config/gws/* ~/.config/gws-users/partner/
```

### Container Wiring (TODO)

1. Mount `~/.config/gws-users/` read-only into the container at `/workspace/gws-users/`
2. Add the mount in `src/container-runner.ts` alongside the existing gws config mount
3. Update `container/skills/gws/SKILL.md` to teach the agent:
   - Map Slack sender to user (e.g. Slack display name or user ID → credential directory)
   - Before any `gws` command, copy the right credentials: `cp /workspace/gws-users/<user>/* ~/.config/gws/`
4. The agent determines which user to act as based on who sent the message in the Slack channel

### Credential Precedence (from gws docs)

1. `GOOGLE_WORKSPACE_CLI_TOKEN` env var
2. `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` env var
3. Encrypted credentials from `gws auth login` (`~/.config/gws/credentials.enc`)
4. Plaintext credentials in `~/.config/gws/credentials.json`

### Current State

- Duane's account: authenticated, mounted into all containers
- Partner's account: not yet authenticated — requires their browser session for OAuth
