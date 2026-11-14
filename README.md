# Keuangan Pribadi Skills

Agent skill dan MCP server untuk aplikasi
[Keuangan Pribadi](https://app.keuanganpribadi.web.id). Agent bisa mencatat
pemasukan dan pengeluaran, transfer antar dompet, mengoreksi saldo, serta
mengelola hutang, tabungan, anggaran, dan aset milik user lewat API key
pribadinya.

Bekerja di Claude Code, Claude Desktop, claude.ai, Codex, Cursor, OpenCode,
Hermes Agent, OpenClaw, dan klien lain yang membaca format `SKILL.md`.

## Mulai cepat

1. Di aplikasi, buka **Pengaturan → AI Agent & API**, buat API key, lalu unduh
   file `keuangan.agq`.
2. Unduh `keuangan-pribadi-skill.zip` dari halaman yang sama dan ekstrak ke
   folder skill klienmu:

   | Klien | Folder |
   |---|---|
   | Claude Code | `~/.claude/skills/` |
   | Codex | `~/.codex/skills/` |
   | Cursor | `~/.cursor/skills/` |
   | OpenCode | `~/.config/opencode/skills/` |
   | claude.ai / Claude Desktop | upload zip lewat **Customize → Skills** |

3. Simpan `keuangan.agq` di `~/.config/keuangan-pribadi/keuangan.agq` atau set
   `KEUANGAN_API_KEY`.
4. Minta agent: "catat beli kopi 15rb pakai cash".

Untuk memasang lewat agent, salin prompt sesuai klien dari folder
[`prompts/`](prompts/).

| Klien | Prompt |
|---|---|
| Claude Code | [`install-claude-code.md`](prompts/install-claude-code.md) |
| Claude Desktop (MCP) | [`install-claude-desktop.md`](prompts/install-claude-desktop.md) |
| Codex | [`install-codex.md`](prompts/install-codex.md) |
| Cursor | [`install-cursor.md`](prompts/install-cursor.md) |
| OpenClaw, Hermes, bot lain | [`install-http-agent.md`](prompts/install-http-agent.md) |

## Isi

```
.
├── prompts/                      prompt pemasangan per klien
├── scripts/build.mjs             validasi, tulis api.md, buat dist/*.zip
└── skills/
    └── keuangan-pribadi/
        ├── SKILL.md              pintu masuk skill
        ├── references/
        │   ├── api.md            semua action dan parameter (dibuat otomatis)
        │   ├── workflow.md       draft, konfirmasi, eksekusi
        │   ├── parsing.md        angka, tanggal, tipe transaksi
        │   ├── errors.md         kode error dan kuota
        │   └── mcp.md            konfigurasi MCP per klien
        └── scripts/
            ├── actions.mjs       katalog action (satu sumber)
            ├── kp.mjs            CLI: node kp.mjs <action> [json]
            └── mcp.mjs           MCP server stdio
```

## MCP

`skills/keuangan-pribadi/scripts/mcp.mjs` adalah MCP server lokal tanpa
dependency. Setiap action menjadi tool `keuangan_<action>`. Konfigurasi untuk
Claude Desktop, Claude Code, dan Cursor ada di
[`references/mcp.md`](skills/keuangan-pribadi/references/mcp.md).

## Pengembangan

```bash
node scripts/build.mjs           # validasi + tulis ulang api.md + dist/keuangan-pribadi-skill.zip
node scripts/build.mjs --check   # validasi saja (dipakai CI)
```

Tambah atau ubah action di `skills/keuangan-pribadi/scripts/actions.mjs`. CLI,
MCP server, dan `api.md` mengikuti otomatis. Setelah build, salin
`dist/keuangan-pribadi-skill.zip` ke `public/downloads/` di repo aplikasi.

## Keamanan

API key memberi akses penuh ke data keuangan user. Jangan commit file `.agq`
atau key ke repo. `.gitignore` di repo ini sudah menolak `*.agq` dan `.env`.
