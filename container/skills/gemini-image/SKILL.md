---
name: gemini-image
description: Generate images using Google Gemini (gemini-3.1-flash-image-preview). Use when the user asks you to create, generate, draw, or design an image. Produces PNG images and can send them directly to chat.
allowed-tools: Bash(gemini-image:*)
---

# Gemini Image Generation

Generate images using Google Gemini's native image generation capability.

## Quick start

```bash
gemini-image generate "a cat wearing a top hat"              # Generate and save to workspace
gemini-image generate "a sunset over mountains" --send       # Generate and send to chat
```

## Commands

### generate — Create an image from a text prompt

```bash
gemini-image generate "<prompt>"                    # Save to generated-images/
gemini-image generate "<prompt>" --send             # Save AND send to chat via IPC
gemini-image generate "<prompt>" --output photo.png # Save to specific path
```

The prompt should be a detailed description of the image you want to generate. More detail produces better results.

Options:
- `--send` — After generating, write an IPC file so the image is sent to the current chat. Requires the IPC directory to be mounted.
- `--output <path>` — Save to a specific file path instead of the default `generated-images/` directory.

### Examples

```bash
# Simple generation
gemini-image generate "a photorealistic golden retriever puppy playing in autumn leaves"

# Generate and send to chat
gemini-image generate "a minimalist logo for a coffee shop called Bean There" --send

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
3. Saves the PNG to the workspace
4. If `--send` is used, writes an IPC message file so the host sends it to chat

## Environment

Requires `GEMINI_API_KEY` environment variable to be set (injected by the host).
