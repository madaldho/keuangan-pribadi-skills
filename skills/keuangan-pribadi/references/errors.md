# Error dan cara menanganinya

Semua error berbentuk `{"error": "pesan", ...field tambahan}`.

| Status | Arti | Yang dilakukan agent |
|---|---|---|
| 400 | Data kurang atau salah format | Baca `error`, perbaiki field, tanya user bila perlu |
| 401 | Header `X-API-Key` kosong, key salah, nonaktif, atau kedaluwarsa | Minta user membuat key baru di Pengaturan → AI Agent & API. Jangan coba ulang |
| 403 | Fitur Pro pada akun Free (`pro_only_action`), atau key tidak punya izin (`read`, `create`, `update`, `delete`) | Jelaskan bahwa fitur itu butuh Pro, atau izin key kurang. Jangan coba ulang |
| 404 | Dompet, kategori, atau data tidak ditemukan | Tampilkan `available_wallets` / `available_categories` sebagai pilihan |
| 429 | Kuota analisis Free (3x/hari untuk `context` dan `stats`) habis | Berhenti memanggil `context`/`stats`. Aksi catat tetap jalan. Sebutkan `usage.reset_at` |
| 500 | Kesalahan server | Coba sekali lagi setelah jeda. Kalau tetap gagal, laporkan ke user tanpa mengarang hasil |

## Kuota akun Free

- `context` dan `stats`: 3 kali per hari (reset 00.00 UTC, 07.00 WIB).
  Simpan hasil `context` pertama dan pakai ulang sepanjang sesi.
- `usage` tidak memakan kuota. Pakai untuk mengecek sisa.
- Catat transaksi, transfer, dompet, dan kategori tidak dibatasi.
- Hutang, tabungan, anggaran, dan aset: 403 untuk akun Free.

## Jangan mengarang hasil

Kalau request gagal atau belum dikirim, jangan menulis "sudah tercatat". Saldo
akhir hanya boleh diambil dari respons API.
