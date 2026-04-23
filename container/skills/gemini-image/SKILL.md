---
name: gemini-image
description: Generate images using Google Gemini (gemini-3.1-flash-image-preview). Use when the user asks you to create, generate, draw, or design an image. Produces PNG images — attach the saved file to chat to deliver it.
allowed-tools: Bash(gemini-image:*)
---

# Gemini Image Generation

Generate images using Google Gemini's native image generation capability.

## Quick start

```bash
gemini-image generate "a cat wearing a top hat"                   # Save to generated-images/
gemini-image generate "a sunset" --output sunset.png              # Save to specific path
```

The command prints the saved image path on stdout. To deliver it to chat, attach the file using the agent-runner's attachment mechanism (v2 delivers attachments through outbound.db, not IPC file drops).

## Commands

### generate — Create an image from a text prompt

```bash
gemini-image generate "<prompt>"                    # Save to generated-images/
gemini-image generate "<prompt>" --output photo.png # Save to specific path
```

The prompt should be a detailed description of the image you want to generate. More detail produces better results.

Options:
- `--output <path>` — Save to a specific file path instead of the default `generated-images/` directory.

### Examples

```bash
# Simple generation (path is printed; attach it to deliver)
gemini-image generate "a photorealistic golden retriever puppy playing in autumn leaves"

# Save to specific location
gemini-image generate "an architectural sketch of a modern treehouse" --output designs/treehouse.png
```

## Tips for better prompts

- Be specific about style: "watercolor painting of...", "photorealistic...", "pixel art of..."
- Include details about lighting, composition, and mood
- Mention colors, textures, and background elements
- Specify aspect ratio or framing if important: "close-up portrait", "wide landscape shot"

## How it works

1. Calls the Gemini API (`gemini-3.1-flash-image-preview` model) with your prompt
2. Extracts the base64-encoded image from the response
3. Saves the PNG to the workspace and prints the path on stdout

## Environment

Requires `GEMINI_API_KEY` — injected by OneCLI on requests to `*generativelanguage.googleapis.com*`. No env-var scaffolding in the container.
