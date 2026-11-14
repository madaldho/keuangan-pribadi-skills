# Hubungkan bot atau agent HTTP (OpenClaw, Hermes, custom GPT, bot Telegram)

Untuk agent yang tidak membaca `SKILL.md` tapi bisa memanggil HTTP.

## 1. API key

Buat key di aplikasi: **Pengaturan → AI Agent & API → Buat API key**. Simpan
di fitur secret atau environment milik agent dengan nama `KEUANGAN_API_KEY`.
Jangan menempelkan key ke system prompt kalau agent punya tempat secret.

## 2. System prompt

Di halaman yang sama, buka tab **System prompt** dan salin isinya ke kolom
instruksi agent. Prompt itu memuat alur draft, konfirmasi, eksekusi dan daftar
action.

## 3. Endpoint

```
Base URL : https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/keuangan-api
Header   : X-API-Key: <KEUANGAN_API_KEY>
Action   : ?action=<nama>
```

Daftar lengkap action ada di
[skills/keuangan-pribadi/references/api.md](../skills/keuangan-pribadi/references/api.md).
Untuk custom GPT, tiap action bisa dijadikan satu operasi di schema Actions.

## 4. Uji

Minta agent memanggil `GET ?action=usage`. Respons benar berisi
`subscription` dan `usage`.
