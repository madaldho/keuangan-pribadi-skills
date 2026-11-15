# MCP server

Ada dua cara memakai MCP.

## 1. Konektor remote (disarankan)

URL: `https://app.keuanganpribadi.web.id/mcp`

Tanpa API key. Tempel URL sebagai konektor kustom; klien membuka halaman
login Keuangan Pribadi, pengguna menekan Izinkan, selesai (OAuth 2.1 +
PKCE, Dynamic Client Registration).

| Klien | Cara |
|---|---|
| Claude (web, desktop, mobile) | Settings → Connectors → Add custom connector → isi URL → Connect |
| ChatGPT | Settings → Apps & Connectors → Create (developer mode) → URL, OAuth |
| Claude Code | `claude mcp add --transport http keuangan-pribadi https://app.keuanganpribadi.web.id/mcp`, lalu `/mcp` → Authenticate |
| Codex | `[mcp_servers.keuangan-pribadi]` dengan `url = "https://app.keuanganpribadi.web.id/mcp"`, lalu `codex mcp login keuangan-pribadi` |

Tool sama dengan action API (`keuangan_<action>`, 33 tool) dan kuota Free/Pro
sama. Akses dicabut di aplikasi: Pengaturan → AI Agent & API → Aplikasi terhubung.

## 2. Server lokal (API key)

`scripts/mcp.mjs` membuka setiap action API sebagai tool MCP bernama
`keuangan_<action>` (33 tool). Server berjalan lokal lewat stdio, tanpa
dependency, butuh Node.js 18+. Pakai bila klienmu belum mendukung konektor URL.

## Perlu MCP atau tidak?

| Klien | Rekomendasi |
|---|---|
| Claude, ChatGPT, klien dengan konektor URL | Konektor remote di atas |
| Cursor, Windsurf, VS Code Copilot | MCP. Klien ini tidak bisa menjalankan `curl` sendiri |
| Claude Code, Codex, OpenCode | Skill saja sudah cukup (agent menjalankan `kp.mjs`). MCP opsional untuk tool bertipe |
| ChatGPT custom GPT, OpenClaw, Hermes, bot Telegram | HTTP API langsung dengan system prompt dari aplikasi |

## Kredensial

Isi salah satu:

- `KEUANGAN_API_KEY=kp_...`
- `KEUANGAN_KEY_FILE=/path/ke/keuangan.agq` (file yang diunduh dari aplikasi)

Opsional: `KEUANGAN_API_URL` untuk mengganti base URL.

## Claude Desktop

Buka Settings → Developer → Edit Config, lalu tambahkan:

```json
{
  "mcpServers": {
    "keuangan-pribadi": {
      "command": "node",
      "args": ["/Users/kamu/.claude/skills/keuangan-pribadi/scripts/mcp.mjs"],
      "env": { "KEUANGAN_KEY_FILE": "/Users/kamu/keuangan.agq" }
    }
  }
}
```

Mulai ulang Claude Desktop. Tool `keuangan_*` muncul di ikon palu.

## Claude Code

```bash
claude mcp add keuangan-pribadi --scope user \
  --env KEUANGAN_KEY_FILE="$HOME/keuangan.agq" \
  -- node "$HOME/.claude/skills/keuangan-pribadi/scripts/mcp.mjs"
```

## Cursor

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "keuangan-pribadi": {
      "command": "node",
      "args": ["/path/ke/keuangan-pribadi/scripts/mcp.mjs"],
      "env": { "KEUANGAN_KEY_FILE": "/path/ke/keuangan.agq" }
    }
  }
}
```

## Uji cepat tanpa klien

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
  | KEUANGAN_KEY_FILE=~/keuangan.agq node scripts/mcp.mjs
```

## Keamanan

- Tool hapus (`keuangan_delete_*`) diberi tanda `destructiveHint`, dan tanpa
  `confirm: true` hanya mengembalikan preview.
- Key hanya dibaca dari env atau file lokal; server tidak menulis key ke log.
- Cabut key kapan saja di aplikasi: Pengaturan → AI Agent & API → Nonaktifkan
  atau Hapus.
