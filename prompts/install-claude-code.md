# Pasang skill Keuangan Pribadi di Claude Code

Pasang skill `keuangan-pribadi`, pastikan bisa dipakai, lalu berhenti. Jangan
mencatat transaksi apa pun.

## 1. Unduh dan ekstrak

```bash
mkdir -p ~/.claude/skills
curl -fsSL -o /tmp/keuangan-pribadi-skill.zip https://app.keuanganpribadi.web.id/downloads/keuangan-pribadi-skill.zip
unzip -oq /tmp/keuangan-pribadi-skill.zip -d ~/.claude/skills
rm /tmp/keuangan-pribadi-skill.zip
```

Kalau unduhan gagal, minta saya mengunduh zip dari aplikasi (**Pengaturan → AI
Agent & API → Unduh skill**) dan menyebutkan lokasinya, lalu ekstrak dari sana.

## 2. Cek file

Pastikan `~/.claude/skills/keuangan-pribadi/SKILL.md` dan
`~/.claude/skills/keuangan-pribadi/scripts/kp.mjs` ada, dan `node --version` minimal 18.

## 3. Simpan API key

Tanya saya di mana file `keuangan.agq` yang saya unduh dari aplikasi. Pindahkan
ke `~/.config/keuangan-pribadi/keuangan.agq` dan set izinnya `600`. Jangan
tampilkan isi file atau key di chat.

Kalau saya belum punya file itu, minta saya membuka aplikasi Keuangan Pribadi,
**Pengaturan → AI Agent & API → Buat API key**, lalu klik **Unduh .agq**.

## 4. Periksa

Jalankan dari folder skill:

```bash
node scripts/kp.mjs usage
```

Hasil yang benar berisi `subscription` dan `usage`. Kalau keluar `HTTP 401`,
key salah atau sudah dinonaktifkan: minta saya membuat key baru.

## 5. Berhenti

Laporkan folder pemasangan dan status langganan dari langkah 4. Jangan mencatat
transaksi apa pun. Tanya saya apa yang ingin dicatat.
