# Alur kerja: draft, konfirmasi, eksekusi

Setiap aksi yang menulis data (buat, ubah, transfer, hutang, tabungan, anggaran,
aset, hapus) mengikuti empat langkah ini.

## 1. Draft

Ambil dari pesan user:

| Field | Wajib | Sumber |
|---|---|---|
| `amount` | ya | angka di pesan, lihat [parsing.md](parsing.md) |
| `type` | ya | kata kerja: beli/bayar = `expense`, terima/gajian = `income` |
| `wallet_name` | ya | nama dompet yang ada di `context.wallets` |
| `category_name` | untuk transaksi | nama kategori yang ada di `context.categories` sesuai tipe |
| `description` | tidak | sisa kalimat yang menjelaskan barangnya |
| `date` | tidak | default hari ini, zona Asia/Jakarta |

## 2. Lengkapi

Field wajib yang kosong atau ambigu ditanyakan dengan pilihan nyata:

```
Pengeluaran Rp30.000 dari Cash. Masuk kategori apa?
Pilihan: Makanan, Belanja, Transportasi
```

```
Rp50.000 dari dompet mana?
Cash (Rp200.000), BCA (Rp5.000.000), Dana (Rp100.000)
```

Kategori yang disebut user tapi tidak ada:

```
Kategori "Servis Motor" belum ada. Yang mirip: Transportasi.
Pakai Transportasi, atau saya buatkan kategori baru?
```

Kalau user memilih "buat baru", kirim `create_category_if_missing: true` di
`create_transaction`.

## 3. Konfirmasi

Tunjukkan draft dan dampaknya ke saldo:

```
Draft pengeluaran
  Jumlah    Rp15.000
  Dompet    Cash (saldo Rp200.000, setelahnya Rp185.000)
  Kategori  Makanan
  Catatan   kopi susu
  Tanggal   hari ini
Catat sekarang? (ya / ubah / batal)
```

Tunggu jawaban setuju. "Langsung aja" boleh melewati langkah ini hanya kalau
semua field wajib sudah jelas.

## 4. Eksekusi dan laporan

Kirim request. Dari respons, laporkan satu kalimat dan saldo akhir
(`wallet_balance_after` atau objek `wallet`):

```
Tercatat: Makanan Rp15.000 dari Cash. Saldo Cash sekarang Rp185.000.
```

Kalau respons gagal, jelaskan sebabnya dengan bahasa user dan tawarkan langkah
berikutnya. Lihat [errors.md](errors.md).

## Memilih action

| Maksud user | Action |
|---|---|
| beli, bayar, jajan, keluar | `create_transaction` type `expense` |
| gajian, terima, dapat, masuk | `create_transaction` type `income` |
| salah nominal / salah kategori | cari id dengan `transactions` + `search`, lalu `update_transaction` |
| pindah uang antar dompet sendiri | `transfer` |
| top-up atau samakan saldo dengan rekening | `adjust_balance` |
| aku pinjam dari X | `create_loan` type `payable` (lender X) |
| X pinjam dariku | `create_loan` type `receivable` (borrower X) |
| bayar cicilan / X bayar balik | `pay_loan` |
| setor ke tabungan | `savings_deposit` |
| ambil dari tabungan | `savings_withdraw` |
| batas belanja per kategori | `create_budget` |
| beli emas, saham, aset | `create_asset`, nilai baru pakai `update_asset_value` |
| berapa saldo, ringkasan | `context` (sudah di awal sesi) atau `wallets` |

## Hapus

1. Kirim tanpa `confirm`. API mengembalikan `preview: true` dan apa yang akan
   terhapus.
2. Tunjukkan preview ke user, sebutkan dampak ke saldo.
3. Setelah user setuju, kirim ulang dengan `confirm: true`.

## Contoh lengkap

```
User : beli bensin 30rb
Agent: Pengeluaran Rp30.000 untuk bensin. Dari dompet mana?
       Cash (Rp200.000), BCA (Rp5.000.000)
User : cash
Agent: Draft pengeluaran
         Jumlah    Rp30.000
         Dompet    Cash (setelahnya Rp170.000)
         Kategori  Transportasi
         Catatan   bensin
       Catat? (ya / ubah / batal)
User : ya
Agent: [create_transaction {"amount":30000,"type":"expense","wallet_name":"Cash","category_name":"Transportasi","description":"bensin"}]
       Tercatat. Saldo Cash sekarang Rp170.000.
```
