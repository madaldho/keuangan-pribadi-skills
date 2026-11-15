# Referensi API

<!-- Dibuat oleh scripts/build.mjs dari scripts/actions.mjs. Jangan edit manual. -->

Base URL: `https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/keuangan-api`

Setiap request memakai header `X-API-Key: kp_...`. Action dipilih lewat query
`?action=<nama>`. Untuk `GET` dan `DELETE`, parameter dikirim sebagai query
string. Untuk `POST` dan `PATCH`, parameter dikirim sebagai body JSON.
Field bercetak tebal wajib diisi.

```bash
curl -s "https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/keuangan-api?action=context" -H "X-API-Key: $KEUANGAN_API_KEY"

curl -s -X POST "https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/keuangan-api?action=create_transaction" \
  -H "X-API-Key: $KEUANGAN_API_KEY" -H "Content-Type: application/json" \
  -d '{"amount":15000,"type":"expense","wallet_name":"Cash","category_name":"Makanan"}'
```

## Baca data

### `context`

`GET ?action=context` (kuota Free 3x/hari)

Snapshot akun: dompet, kategori, ringkasan bulan ini, hutang, tabungan, anggaran, aset, status langganan, izin key. Panggil sekali di awal sesi.

Tanpa parameter.

### `stats`

`GET ?action=stats` (kuota Free 3x/hari)

Ringkasan keuangan (alias context).

Tanpa parameter.

### `usage`

`GET ?action=usage`

Sisa kuota harian dan status Pro. Tidak memakan kuota.

Tanpa parameter.

### `wallets`

`GET ?action=wallets`

Daftar semua dompet beserta saldo.

Tanpa parameter.

### `wallet`

`GET ?action=wallet`

Detail satu dompet.

- **`id`** string: UUID atau nama dompet.

### `transactions`

`GET ?action=transactions`

Daftar transaksi dengan filter. Pakai search untuk mencari id sebelum update atau hapus.

- `type` string (income \| expense \| transfer): income, expense, atau transfer.
- `wallet_id` string: UUID dompet.
- `category` string: Nama kategori.
- `search` string: Kata di judul atau catatan.
- `date_from` string: Mulai tanggal (YYYY-MM-DD).
- `date_to` string: Sampai tanggal (YYYY-MM-DD).
- `limit` number: Jumlah maksimum baris. Default 50.

### `transaction`

`GET ?action=transaction`

Detail satu transaksi.

- **`id`** string: UUID dari respons sebelumnya.

### `categories`

`GET ?action=categories`

Daftar kategori pemasukan dan pengeluaran.

Tanpa parameter.

### `loans`

`GET ?action=loans` (Pro)

Daftar hutang dan piutang.

- `type` string (payable \| receivable): payable (hutang kita) atau receivable (piutang).
- `status` string (unpaid \| partial \| paid): unpaid, partial, atau paid.
- `limit` number: Jumlah maksimum baris.

### `savings`

`GET ?action=savings` (Pro)

Daftar target tabungan dan progresnya.

Tanpa parameter.

### `budgets`

`GET ?action=budgets` (Pro)

Daftar anggaran aktif.

Tanpa parameter.

### `assets`

`GET ?action=assets` (Pro)

Daftar aset (emas, saham, properti) dan nilainya.

Tanpa parameter.

## Tulis data

### `create_transaction`

`POST ?action=create_transaction`

Catat pemasukan atau pengeluaran. Saldo dompet berubah otomatis.

- **`amount`** number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- **`type`** string (income \| expense): income atau expense.
- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- `category_name` string: Nama kategori yang ada di context.
- `description` string: Catatan singkat.
- `date` string: Tanggal YYYY-MM-DD. Default hari ini.
- `create_category_if_missing` boolean: true hanya bila user setuju membuat kategori baru.

### `update_transaction`

`PATCH ?action=update_transaction`

Koreksi transaksi yang sudah ada. Saldo dihitung ulang otomatis. Jangan hapus lalu buat ulang.

- **`id`** string: UUID dari respons sebelumnya.
- `amount` number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- `type` string (income \| expense): income atau expense.
- `wallet_name` string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- `category_name` string: Nama kategori baru.
- `title` string: Judul baru.
- `description` string: Catatan baru.
- `date` string: Tanggal YYYY-MM-DD. Default hari ini.

### `transfer`

`POST ?action=transfer`

Pindahkan uang antar dompet milik user. Kedua saldo berubah otomatis.

- **`amount`** number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- **`from_wallet_name`** string: Dompet asal.
- **`to_wallet_name`** string: Dompet tujuan.
- `source_fee` number: Biaya admin yang dipotong dari dompet asal.
- `destination_fee` number: Biaya yang dipotong di dompet tujuan.
- `description` string: Catatan.
- `date` string: Tanggal YYYY-MM-DD. Default hari ini.

### `adjust_balance`

`POST ?action=adjust_balance`

Top-up atau koreksi saldo tanpa kategori. Isi salah satu: adjustment (selisih) atau new_balance (saldo akhir).

- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- `adjustment` number: Selisih, boleh negatif. 1000000 berarti tambah 1 juta.
- `new_balance` number: Saldo akhir yang diinginkan.
- `description` string: Alasan koreksi.

### `create_wallet`

`POST ?action=create_wallet`

Buat dompet baru. Akun Free maksimal 5 dompet. Nama bank/e-wallet yang dikenal (BCA, Mandiri, BRI, BNI, BSI, Jago, SeaBank, Jenius, GoPay, OVO, Dana, ShopeePay, LinkAja, dll) otomatis dapat logo, warna, dan tipe Saran Pintar.

- **`name`** string: Nama dompet. Pakai nama bank/e-wallet apa adanya (mis. "BCA", "GoPay") supaya logonya terpasang.
- `type` string (cash \| bank \| savings \| investment): cash (tunai), bank, savings (tabungan), atau investment (E-Wallet). Boleh dikosongkan untuk bank/e-wallet yang dikenal.
- `balance` number: Saldo awal.
- `color` string: Warna hex. Kosongkan untuk bank/e-wallet yang dikenal agar warna merek dipakai.

### `update_wallet`

`PATCH ?action=update_wallet`

Ganti nama, tipe, warna, atau pasang logo dompet. Bukan untuk mengubah saldo.

- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- `new_name` string: Nama baru.
- `type` string (cash \| bank \| savings \| investment): cash (tunai), bank, savings (tabungan), atau investment (E-Wallet).
- `color` string: Warna hex.
- `apply_preset` boolean: true untuk memasang logo dan warna Saran Pintar sesuai nama dompet (untuk dompet bank/e-wallet yang belum berlogo).

### `archive_wallet`

`PATCH ?action=archive_wallet`

Arsipkan atau buka arsip dompet.

- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- **`archive`** boolean: true untuk arsip, false untuk membuka.

### `hide_wallet`

`PATCH ?action=hide_wallet`

Sembunyikan dompet dari total saldo.

- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- **`hide`** boolean: true untuk sembunyikan.

### `create_category`

`POST ?action=create_category`

Buat kategori. Akun Free maksimal 10 kategori. Duplikat dilewati.

- **`name`** string: Nama kategori.
- **`type`** string (income \| expense): income atau expense.
- `color` string: Warna hex.
- `icon` string: Nama ikon.

### `create_loan`

`POST ?action=create_loan` (Pro)

Catat hutang (payable) atau piutang (receivable). Bila wallet_name diisi, hutang menambah saldo dan piutang menguranginya.

- **`type`** string (payable \| receivable): payable atau receivable.
- **`amount`** number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- **`description`** string: Keterangan.
- `lender` string: Pemberi pinjaman (untuk payable).
- `borrower` string: Peminjam (untuk receivable).
- `due_date` string: Jatuh tempo (YYYY-MM-DD).
- `wallet_name` string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".

### `pay_loan`

`POST ?action=pay_loan` (Pro)

Bayar cicilan hutang atau terima pembayaran piutang. Saldo dompet berubah otomatis.

- **`id`** string: UUID loan.
- **`amount`** number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- `description` string: Catatan.
- `date` string: Tanggal YYYY-MM-DD. Default hari ini.

### `create_savings`

`POST ?action=create_savings` (Pro)

Buat target tabungan.

- **`name`** string: Nama target.
- **`target_amount`** number: Target dalam Rupiah.
- `current_amount` number: Isi awal.
- `target_date` string: Tanggal target.
- `description` string: Keterangan.
- `category` string: Kategori tabungan.

### `savings_deposit`

`POST ?action=savings_deposit` (Pro)

Setor ke tabungan: dompet berkurang, tabungan bertambah.

- **`savings_id`** string: UUID tabungan.
- **`amount`** number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- `description` string: Catatan.
- `date` string: Tanggal YYYY-MM-DD. Default hari ini.

### `savings_withdraw`

`POST ?action=savings_withdraw` (Pro)

Tarik dari tabungan: tabungan berkurang, dompet bertambah.

- **`savings_id`** string: UUID tabungan.
- **`amount`** number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- **`wallet_name`** string: Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".
- `description` string: Catatan.
- `date` string: Tanggal YYYY-MM-DD. Default hari ini.

### `create_budget`

`POST ?action=create_budget` (Pro)

Buat anggaran per kategori.

- **`category`** string: Nama kategori pengeluaran.
- **`amount`** number: Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.
- **`period`** string (monthly \| weekly \| custom \| date_range): monthly, weekly, custom, atau date_range.
- `start_date` string: Mulai (untuk custom/date_range).
- `end_date` string: Selesai (untuk custom/date_range).

### `create_asset`

`POST ?action=create_asset` (Pro)

Catat aset baru.

- **`name`** string: Nama aset.
- `category` string: emas, saham, properti, kendaraan, dll.
- **`initial_value`** number: Nilai beli.
- `current_value` number: Nilai sekarang.
- `purchase_date` string: Tanggal beli.
- `quantity` number: Jumlah unit.
- `unit_type` string: gram, lembar, unit, dll.
- `is_divisible` boolean: Bisa dijual sebagian.

### `update_asset_value`

`PATCH ?action=update_asset_value` (Pro)

Perbarui nilai aset. Riwayat nilai disimpan.

- **`id`** string: UUID aset.
- **`value`** number: Nilai terbaru.
- `date` string: Tanggal YYYY-MM-DD. Default hari ini.

## Hapus

### `delete_transaction`

`DELETE ?action=delete_transaction` (dua langkah)

Hapus transaksi (saldo dikembalikan). Tanpa confirm hanya preview; kirim confirm=true setelah user setuju.

- **`id`** string: UUID.
- `confirm` boolean: false atau kosong = preview. true = hapus sungguhan.

### `delete_wallet`

`DELETE ?action=delete_wallet` (dua langkah)

Hapus dompet. Tanpa confirm hanya preview; kirim confirm=true setelah user setuju.

- **`id`** string: UUID atau nama dompet.
- `confirm` boolean: false atau kosong = preview. true = hapus sungguhan.

### `delete_category`

`DELETE ?action=delete_category` (dua langkah)

Hapus kategori. Tanpa confirm hanya preview; kirim confirm=true setelah user setuju.

- **`id`** string: UUID.
- `confirm` boolean: false atau kosong = preview. true = hapus sungguhan.

### `delete_loan`

`DELETE ?action=delete_loan` (Pro, dua langkah)

Hapus hutang/piutang beserta transaksinya. Tanpa confirm hanya preview; kirim confirm=true setelah user setuju.

- **`id`** string: UUID.
- `confirm` boolean: false atau kosong = preview. true = hapus sungguhan.
