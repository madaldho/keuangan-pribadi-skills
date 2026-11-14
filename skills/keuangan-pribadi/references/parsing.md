# Membaca angka, tanggal, dan maksud

## Angka

Kirim ke API sebagai angka bulat Rupiah.

| Ditulis user | Nilai |
|---|---|
| `5rb`, `5 ribu`, `5k` | 5000 |
| `50rb`, `50k` | 50000 |
| `1jt`, `1 juta` | 1000000 |
| `2,5jt`, `2.5jt`, `2.5 juta` | 2500000 |
| `1,2M`, `1.2 miliar` | 1200000000 |
| `Rp15.000`, `15.000` | 15000 (titik = pemisah ribuan) |
| `15.000,50` | 15000 (bulatkan; aplikasi tidak menyimpan sen) |

Titik di antara tiga digit adalah pemisah ribuan, bukan desimal. Desimal hanya
muncul bersama satuan (`2.5jt`). Kalau ragu ("1.500" bisa berarti seribu lima
ratus atau satu setengah juta), tanyakan.

## Tanggal

Zona waktu Asia/Jakarta. Kirim `YYYY-MM-DD`.

| Ditulis user | Tanggal |
|---|---|
| hari ini, tadi, barusan | hari ini |
| kemarin | hari ini − 1 |
| lusa kemarin, kemarin lusa | hari ini − 2 |
| tanggal 5, tgl 5 | tanggal 5 bulan ini; kalau tanggal itu belum lewat, tanyakan apakah maksudnya bulan lalu |
| Senin kemarin | Senin terakhir sebelum hari ini |

Tanggal masa depan untuk transaksi biasa hampir selalu salah ketik. Konfirmasi
dulu.

## Tipe transaksi

| Kata | Tipe |
|---|---|
| beli, bayar, jajan, keluar, kasih, sedekah, transfer ke orang lain | `expense` |
| terima, dapat, gajian, masuk, cair, bonus, refund | `income` |
| pindahin, top up dari BCA ke Dana | `transfer` (antar dompet sendiri) |
| pinjam dari, ngutang ke | hutang, `create_loan` `payable` |
| minjemin, kasih pinjam | piutang, `create_loan` `receivable` |
| nabung, setor tabungan | `savings_deposit` |
| ambil tabungan | `savings_withdraw` |

## Nama dompet dan kategori

Cocokkan tanpa membedakan huruf besar dan kecil, lalu kirim nama persis seperti
di `context`. "bca" menjadi "BCA". "gopay" dan "GoPay" sama. Kalau dua dompet
cocok ("BCA" dan "BCA Tahapan"), tanyakan.
