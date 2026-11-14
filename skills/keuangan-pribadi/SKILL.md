---
name: keuangan-pribadi
description: >
  Gunakan skill ini saat user ingin mencatat atau membaca keuangan pribadinya
  di aplikasi Keuangan Pribadi: catat pemasukan atau pengeluaran, transfer antar
  dompet, koreksi saldo, cek saldo dan ringkasan bulan ini, kelola dompet dan
  kategori, hutang dan piutang, target tabungan, anggaran, serta aset. Pakai juga
  saat user menulis kalimat seperti "beli kopi 15rb pakai cash", "gajian 5jt
  masuk BCA", "berapa sisa saldo", atau "aku pinjam 500rb dari Budi".
compatibility: >
  Butuh akses jaringan ke Supabase Edge Function keuangan-api dan API key
  milik user (diawali kp_). Script CLI dan MCP server butuh Node.js 18+.
metadata:
  version: "1.0.0"
  api_base_url: "https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/keuangan-api"
---

# Keuangan Pribadi

Skill ini menghubungkan agent ke akun Keuangan Pribadi milik satu user lewat
HTTP API. Setiap aksi tulis langsung mengubah data asli user, jadi agent bekerja
dengan pola **draft, konfirmasi, eksekusi**.

## Sebelum mulai

1. Cari API key user. Urutan pencarian:
   - variabel lingkungan `KEUANGAN_API_KEY`;
   - file `.agq` yang user unduh dari aplikasi (baris `KEUANGAN_API_KEY=...`),
     biasanya di folder kerja atau `~/.config/keuangan-pribadi/`;
   - kalau tidak ada, minta user membuat key di aplikasi: **Pengaturan → AI
     Agent & API → Buat API key**, lalu unduh file `.agq`.
2. Jangan pernah menampilkan key utuh ke chat. Sebut saja empat karakter
   terakhirnya kalau perlu.
3. Panggil `context` sekali di awal sesi. Simpan daftar dompet, kategori,
   status langganan, dan izin key. Semua validasi berikutnya memakai data ini.

## Cara memanggil API

Pilih jalur yang tersedia, dari atas ke bawah:

| Jalur | Kapan | Cara |
|---|---|---|
| MCP | Tool `keuangan_*` sudah muncul di daftar tool | Panggil tool-nya langsung |
| CLI | Agent punya shell dan Node.js | `node scripts/kp.mjs <action> [json]` |
| HTTP | Selain itu | `curl` dengan header `X-API-Key` |

Detail tiap action, parameter, dan respons ada di
[references/api.md](references/api.md). Contoh CLI:

```bash
node scripts/kp.mjs context
node scripts/kp.mjs create_transaction '{"amount":15000,"type":"expense","wallet_name":"Cash","category_name":"Makanan","description":"kopi"}'
node scripts/kp.mjs delete_transaction '{"id":"<uuid>"}'            # preview
node scripts/kp.mjs delete_transaction '{"id":"<uuid>","confirm":true}'
```

## Alur kerja wajib

Ikuti [references/workflow.md](references/workflow.md) untuk setiap aksi tulis.
Ringkasnya:

1. **Draft.** Ambil jumlah, tipe, dompet, kategori, catatan, dan tanggal dari
   pesan user. Parsing angka dan tanggal ada di
   [references/parsing.md](references/parsing.md).
2. **Lengkapi.** Field wajib yang kosong atau ambigu ditanyakan ke user dengan
   pilihan nyata dari `context`. Jangan menebak dompet pertama atau kategori
   "Lainnya".
3. **Konfirmasi.** Tampilkan draft singkat beserta dampaknya ke saldo, lalu
   tunggu jawaban "ya".
4. **Eksekusi.** Kirim request. Laporkan hasil dan saldo akhir dari respons.

User boleh melewati konfirmasi ("langsung aja") hanya bila semua field jelas.
Hapus data selalu dua langkah: preview tanpa `confirm`, lalu `confirm=true`
setelah user setuju.

## Aturan yang sering dilanggar

- Koreksi transaksi pakai `update_transaction`. Jangan hapus lalu buat ulang.
- Saldo dompet dihitung otomatis oleh database. Jangan ubah `balance` lewat
  `update_wallet`. Untuk koreksi saldo pakai `adjust_balance`.
- Setor dan tarik tabungan pakai `savings_deposit` / `savings_withdraw`, bukan
  `create_transaction`.
- Hutang (`payable`) menambah saldo dompet saat dicatat; piutang
  (`receivable`) menguranginya.
- Kirim nama dompet dan kategori sebagai teks (`wallet_name`,
  `category_name`). API mencocokkan nama sendiri.

## Batas paket

Akun Free: `context` dan `stats` maksimal 3 kali per hari; hutang, tabungan,
anggaran, dan aset terkunci (HTTP 403). Akun Pro dan masa trial tidak dibatasi.
Respons 429 berarti kuota habis: berhenti mencoba ulang dan beri tahu user.
Penanganan semua kode error ada di [references/errors.md](references/errors.md).
