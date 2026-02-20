# Timed Auto-Delete Notes

An Obsidian plugin that automatically deletes notes older than a configurable number of days from a designated folder.

## Features

- **Automatic cleanup on startup** – when Obsidian opens, the plugin scans your target folder and removes expired notes.
- **Manual trigger** – click the trash-can ribbon icon or run the **"Delete expired notes now"** command from the command palette.
- **Status bar warning** – shows the number of notes expiring within the next 3 days so you can review them before they're removed.
- **Configurable settings**
  - Target folder path (vault-relative)
  - Expiry duration in days (default: 30)
  - Trash vs. permanent delete toggle

## Installation

### From source

```bash
# Clone / copy this folder into your vault's plugins directory:
#   <vault>/.obsidian/plugins/obsidian-auto-delete/

cd <vault>/.obsidian/plugins/obsidian-auto-delete
npm install
npm run build
```

Then restart Obsidian and enable **Timed Auto-Delete Notes** in *Settings → Community plugins*.

### Manual install (pre-built)

Copy `main.js`, `manifest.json`, and `styles.css` into:

```
<vault>/.obsidian/plugins/obsidian-auto-delete/
```

Enable the plugin in Obsidian settings.

## Usage

1. Open **Settings → Timed Auto-Delete Notes**.
2. Set the **Target folder** to the vault-relative path you want monitored (e.g. `Inbox/Scratch`).
3. Adjust the **Expiry duration** (default 30 days).
4. Choose whether expired notes go to the **system trash** (default) or are **permanently deleted**.
5. Notes whose *creation date* is older than the expiry threshold will be removed automatically on startup, or when you trigger the command manually.

## Commands

| Command | Description |
|---|---|
| **Delete expired notes now** | Immediately scan the target folder and delete all expired notes. |

## Development

```bash
npm install
npm run dev    # watch mode (rebuilds on save)
npm run build  # production build
```


## Inspiration

This plugin was built in response to a request by u/amphyvi in [this Reddit thread](https://www.reddit.com/r/ObsidianMD/comments/1r8vw0w/anyone_have_a_plugin_request/) — a plugin that auto-deletes notes after a set number of days.

## License

MIT
