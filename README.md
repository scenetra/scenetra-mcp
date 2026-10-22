# Scenetra MCP

Let Claude, Cursor and other AI agents build and run AI image and video workflows on [Scenetra](https://www.scenetra.com).

Your agent gets 60+ models (Kling, Seedance, Wan, PixVerse, Grok Imagine, FLUX, Nano Banana, GPT-Image, Seedream and more) on a visual node-based board. Every generation runs a live price auction across 16 providers and bills at provider cost with 0% markup, so the agent always gets the lowest price.

> "Take this product photo, remove the background, and make a 5-second ad video with Seedance."

The agent builds the board, runs it, and hands you the outputs plus a link to the board, which you can open and keep editing.

## Tools

| Tool | What it does |
|---|---|
| `get_guidelines` | How to build good boards (prompt reuse, wiring, layout). Agents call this first. |
| `list_models` | The available image, video and audio models, with prices. |
| `get_model_schema` | A model's input fields and connection handles. |
| `create_board` | Build a board as a blueprint, without running it. Free. |
| `execute_board` | Build and run a board. Returns a `runId` immediately. |
| `get_run_status` | Poll a run until it completes; returns the output URLs. |
| `extend_board` | Add new steps to an existing board, optionally running them. |

Model ids are always routed to the cheapest provider that supports your settings.

## Get a token

1. Sign up at [app.scenetra.com](https://app.scenetra.com) (100 free credits, no card required).
2. Open **Settings → MCP** ([app.scenetra.com/mcp](https://app.scenetra.com/mcp)) and create a token. It starts with `sct_`.

## Setup

### Claude Code

```bash
claude mcp add scenetra --transport http https://app.scenetra.com/api/mcp \
  --header "Authorization: Bearer sct_YOUR_TOKEN"
```

### Cursor

Add to `mcpServers` in Cursor's MCP settings:

```json
{
  "mcpServers": {
    "scenetra": {
      "url": "https://app.scenetra.com/api/mcp",
      "headers": { "Authorization": "Bearer sct_YOUR_TOKEN" }
    }
  }
}
```

### Claude Desktop, Windsurf, and any stdio client

Add to `claude_desktop_config.json` (or your client's MCP config):

```json
{
  "mcpServers": {
    "scenetra": {
      "command": "npx",
      "args": ["-y", "scenetra-mcp"],
      "env": { "SCENETRA_API_TOKEN": "sct_YOUR_TOKEN" }
    }
  }
}
```

### VS Code

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "scenetra": {
      "type": "http",
      "url": "https://app.scenetra.com/api/mcp",
      "headers": { "Authorization": "Bearer sct_YOUR_TOKEN" }
    }
  }
}
```

## How it works

The Scenetra MCP server is hosted at `https://app.scenetra.com/api/mcp` (Streamable HTTP). Clients that support remote servers connect to it directly.

This package, `scenetra-mcp`, is a small stdio bridge for clients that only launch local servers. It forwards every request to the hosted server with your token. Tools, models and pricing all live server-side, so you never need to update the bridge to get new models.

Environment variables:

| Variable | Required | Default |
|---|---|---|
| `SCENETRA_API_TOKEN` | yes | |
| `SCENETRA_MCP_URL` | no | `https://app.scenetra.com/api/mcp` |

## Credits and pricing

`create_board` is free. `execute_board` and `extend_board` with `execute: true` spend credits from your Scenetra account, at provider cost. `list_models` and `get_model_schema` show each model's price, and the agent gets an error with the amount needed if your balance is too low. Plans and credit packs: [scenetra.com/pricing](https://www.scenetra.com/pricing).

## Examples

See [`examples/`](examples) for prompts that work well.

## Development

```bash
npm install
npm run build
SCENETRA_API_TOKEN=sct_... npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
