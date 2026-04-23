# Dockerfile base-layer additions

The v2 `container/Dockerfile` is structurally different from v1's. Don't copy the v1 Dockerfile over. Instead, add only the base-layer OS packages and global npm tools that the custom container skills need.

## Add to v2 `container/Dockerfile`

Edit the appropriate layer of the v2 Dockerfile and add:

### OS packages
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    jq \
    poppler-utils \
  && rm -rf /var/lib/apt/lists/*
```

- `jq` — used by atlas SKILL.md's curl snippets, and by the gemini-image script.
- `poppler-utils` — provides `pdftotext` for the pdf-reader skill and the wiki skill's optional PDF ingestion. (If the `/add-pdf-reader` installer already adds this in v2, delete the duplicate.)

### Global npm tool
```dockerfile
RUN npm install -g @googleworkspace/cli
```

- Provides the `gws` CLI that the gws skill shells out to.

### gemini-image script installation

The v1 Dockerfile had a `COPY container/skills/gemini-image/gemini-image /usr/local/bin/gemini-image && chmod +x ...` pattern. In v2, container skills are mounted into each session, so the gemini-image script is already available at `/workspace/skills/gemini-image/gemini-image` (or wherever v2 mounts `container/skills/`).

**Decision:** either (a) leave the script at its mount path and have the agent call it with a full path, or (b) add a symlink in the v2 Dockerfile:
```dockerfile
RUN ln -s /workspace/skills/gemini-image/gemini-image /usr/local/bin/gemini-image
```
Check v2's actual mount path for `container/skills/` before choosing — the symlink only works if the path is stable across sessions.

## DO NOT copy from v1 Dockerfile

- Anything related to WhatsApp (QR libraries, Baileys deps) — dropped.
- Any `pdf-reader` binary install — `/add-pdf-reader` handles this in v2.
- Any atlas-specific or gws-specific shell/credential scaffolding — OneCLI handles credentials; SKILL.md carries the instructions.
