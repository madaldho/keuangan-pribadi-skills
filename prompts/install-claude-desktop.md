# Pasang MCP Keuangan Pribadi di Claude Desktop

Prompt ini untuk agent yang punya akses shell di komputer saya (misalnya Claude
Code). Agent memasang MCP server untuk Claude Desktop, lalu berhenti.

## 1. Pasang skill

Ikuti langkah 1 sampai 3 di [install-claude-code.md](install-claude-code.md)
sehingga ada `~/.claude/skills/keuangan-pribadi/scripts/mcp.mjs` dan
`~/.config/keuangan-pribadi/keuangan.agq`.

## 2. Tambahkan ke konfigurasi Claude Desktop

File konfigurasi:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Baca file itu dulu. Tambahkan entri di dalam `mcpServers` tanpa menghapus
server lain. Pakai path absolut, bukan `~`:

```json
{
  "mcpServers": {
    "keuangan-pribadi": {
      "command": "node",
      "args": ["/Users/<nama>/.claude/skills/keuangan-pribadi/scripts/mcp.mjs"],
      "env": { "KEUANGAN_KEY_FILE": "/Users/<nama>/.config/keuangan-pribadi/keuangan.agq" }
    }
  }
}
```

Kalau Claude Desktop tidak menemukan `node`, ganti `"node"` dengan hasil
`which node`.

## 3. Uji server

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"keuangan_usage","arguments":{}}}' \
  | KEUANGAN_KEY_FILE="$HOME/.config/keuangan-pribadi/keuangan.agq" node ~/.claude/skills/keuangan-pribadi/scripts/mcp.mjs
```

Respons benar berisi `subscription`. `HTTP 401` berarti key perlu dibuat ulang.

## 4. Berhenti

Minta saya menutup dan membuka ulang Claude Desktop, lalu mengecek tool
`keuangan_*` di ikon palu. Jangan mencatat transaksi apa pun.
