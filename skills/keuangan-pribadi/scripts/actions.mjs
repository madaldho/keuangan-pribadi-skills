// Katalog action keuangan-api. Satu sumber untuk CLI (kp.mjs), MCP server
// (mcp.mjs) dan references/api.md. Ubah di sini, lalu jalankan
// `node scripts/validate.mjs` dari root repo.

export const DEFAULT_BASE_URL =
  'https://pjwmfyvknbtoofxfuwjm.supabase.co/functions/v1/keuangan-api';

const str = (description, extra = {}) => ({ type: 'string', description, ...extra });
const num = (description) => ({ type: 'number', description });
const bool = (description) => ({ type: 'boolean', description });
const date = (description = 'Tanggal YYYY-MM-DD. Default hari ini.') =>
  ({ type: 'string', description, pattern: '^\\d{4}-\\d{2}-\\d{2}' });

const walletName = str('Nama dompet persis seperti di context, misalnya "Cash" atau "BCA".');
const amount = num('Jumlah dalam Rupiah, angka bulat positif. "15rb" ditulis 15000.');
const id = str('UUID dari respons sebelumnya.');

/**
 * method   : HTTP method
 * query    : nama field yang dikirim sebagai query string (sisanya jadi body JSON)
 * readOnly : tidak mengubah data
 * destructive : menghapus data (selalu preview dulu)
 * pro      : terkunci untuk akun Free
 * analysis : dihitung ke kuota 3x/hari akun Free
 */
export const ACTIONS = [
  // ── Baca ──
  { name: 'context', method: 'GET', readOnly: true, analysis: true,
    summary: 'Snapshot akun: dompet, kategori, ringkasan bulan ini, hutang, tabungan, anggaran, aset, status langganan, izin key. Panggil sekali di awal sesi.',
    params: {} },
  { name: 'stats', method: 'GET', readOnly: true, analysis: true,
    summary: 'Ringkasan keuangan (alias context).', params: {} },
  { name: 'usage', method: 'GET', readOnly: true,
    summary: 'Sisa kuota harian dan status Pro. Tidak memakan kuota.', params: {} },
  { name: 'wallets', method: 'GET', readOnly: true,
    summary: 'Daftar semua dompet beserta saldo.', params: {} },
  { name: 'wallet', method: 'GET', readOnly: true, query: ['id'],
    summary: 'Detail satu dompet.',
    params: { id: str('UUID atau nama dompet.') }, required: ['id'] },
  { name: 'transactions', method: 'GET', readOnly: true,
    query: ['type', 'wallet_id', 'category', 'search', 'date_from', 'date_to', 'limit'],
    summary: 'Daftar transaksi dengan filter. Pakai search untuk mencari id sebelum update atau hapus.',
    params: {
      type: str('income, expense, atau transfer.', { enum: ['income', 'expense', 'transfer'] }),
      wallet_id: str('UUID dompet.'),
      category: str('Nama kategori.'),
      search: str('Kata di judul atau catatan.'),
      date_from: date('Mulai tanggal (YYYY-MM-DD).'),
      date_to: date('Sampai tanggal (YYYY-MM-DD).'),
      limit: num('Jumlah maksimum baris. Default 50.'),
    } },
  { name: 'transaction', method: 'GET', readOnly: true, query: ['id'],
    summary: 'Detail satu transaksi.', params: { id }, required: ['id'] },
  { name: 'categories', method: 'GET', readOnly: true,
    summary: 'Daftar kategori pemasukan dan pengeluaran.', params: {} },
  { name: 'loans', method: 'GET', readOnly: true, pro: true, query: ['type', 'status', 'limit'],
    summary: 'Daftar hutang dan piutang.',
    params: {
      type: str('payable (hutang kita) atau receivable (piutang).', { enum: ['payable', 'receivable'] }),
      status: str('unpaid, partial, atau paid.', { enum: ['unpaid', 'partial', 'paid'] }),
      limit: num('Jumlah maksimum baris.'),
    } },
  { name: 'savings', method: 'GET', readOnly: true, pro: true,
    summary: 'Daftar target tabungan dan progresnya.', params: {} },
  { name: 'budgets', method: 'GET', readOnly: true, pro: true,
    summary: 'Daftar anggaran aktif.', params: {} },
  { name: 'assets', method: 'GET', readOnly: true, pro: true,
    summary: 'Daftar aset (emas, saham, properti) dan nilainya.', params: {} },

  // ── Transaksi ──
  { name: 'create_transaction', method: 'POST',
    summary: 'Catat pemasukan atau pengeluaran. Saldo dompet berubah otomatis.',
    params: {
      amount, type: str('income atau expense.', { enum: ['income', 'expense'] }),
      wallet_name: walletName,
      category_name: str('Nama kategori yang ada di context.'),
      description: str('Catatan singkat.'),
      date: date(),
      create_category_if_missing: bool('true hanya bila user setuju membuat kategori baru.'),
    }, required: ['amount', 'type', 'wallet_name'] },
  { name: 'update_transaction', method: 'PATCH',
    summary: 'Koreksi transaksi yang sudah ada. Saldo dihitung ulang otomatis. Jangan hapus lalu buat ulang.',
    params: {
      id, amount, type: str('income atau expense.', { enum: ['income', 'expense'] }),
      wallet_name: walletName, category_name: str('Nama kategori baru.'),
      title: str('Judul baru.'), description: str('Catatan baru.'), date: date(),
    }, required: ['id'] },
  { name: 'transfer', method: 'POST',
    summary: 'Pindahkan uang antar dompet milik user. Kedua saldo berubah otomatis.',
    params: {
      amount, from_wallet_name: str('Dompet asal.'), to_wallet_name: str('Dompet tujuan.'),
      source_fee: num('Biaya admin yang dipotong dari dompet asal.'),
      destination_fee: num('Biaya yang dipotong di dompet tujuan.'),
      description: str('Catatan.'), date: date(),
    }, required: ['amount', 'from_wallet_name', 'to_wallet_name'] },
  { name: 'adjust_balance', method: 'POST',
    summary: 'Top-up atau koreksi saldo tanpa kategori. Isi salah satu: adjustment (selisih) atau new_balance (saldo akhir).',
    params: {
      wallet_name: walletName,
      adjustment: num('Selisih, boleh negatif. 1000000 berarti tambah 1 juta.'),
      new_balance: num('Saldo akhir yang diinginkan.'),
      description: str('Alasan koreksi.'),
    }, required: ['wallet_name'] },

  // ── Dompet & kategori ──
  { name: 'create_wallet', method: 'POST',
    summary: 'Buat dompet baru. Akun Free maksimal 5 dompet.',
    params: {
      name: str('Nama dompet.'),
      type: str('cash, bank, savings, atau investment.', { enum: ['cash', 'bank', 'savings', 'investment'] }),
      balance: num('Saldo awal.'), color: str('Warna hex, misalnya #1f2937.'),
    }, required: ['name'] },
  { name: 'update_wallet', method: 'PATCH',
    summary: 'Ganti nama, tipe, atau warna dompet. Bukan untuk mengubah saldo.',
    params: {
      wallet_name: walletName, new_name: str('Nama baru.'),
      type: str('cash, bank, savings, atau investment.', { enum: ['cash', 'bank', 'savings', 'investment'] }),
      color: str('Warna hex.'),
    }, required: ['wallet_name'] },
  { name: 'archive_wallet', method: 'PATCH',
    summary: 'Arsipkan atau buka arsip dompet.',
    params: { wallet_name: walletName, archive: bool('true untuk arsip, false untuk membuka.') },
    required: ['wallet_name', 'archive'] },
  { name: 'hide_wallet', method: 'PATCH',
    summary: 'Sembunyikan dompet dari total saldo.',
    params: { wallet_name: walletName, hide: bool('true untuk sembunyikan.') },
    required: ['wallet_name', 'hide'] },
  { name: 'create_category', method: 'POST',
    summary: 'Buat kategori. Akun Free maksimal 10 kategori. Duplikat dilewati.',
    params: {
      name: str('Nama kategori.'),
      type: str('income atau expense.', { enum: ['income', 'expense'] }),
      color: str('Warna hex.'), icon: str('Nama ikon.'),
    }, required: ['name', 'type'] },

  // ── Hutang & piutang (Pro) ──
  { name: 'create_loan', method: 'POST', pro: true,
    summary: 'Catat hutang (payable) atau piutang (receivable). Bila wallet_name diisi, hutang menambah saldo dan piutang menguranginya.',
    params: {
      type: str('payable atau receivable.', { enum: ['payable', 'receivable'] }),
      amount, description: str('Keterangan.'),
      lender: str('Pemberi pinjaman (untuk payable).'),
      borrower: str('Peminjam (untuk receivable).'),
      due_date: date('Jatuh tempo (YYYY-MM-DD).'),
      wallet_name: walletName,
    }, required: ['type', 'amount', 'description'] },
  { name: 'pay_loan', method: 'POST', pro: true,
    summary: 'Bayar cicilan hutang atau terima pembayaran piutang. Saldo dompet berubah otomatis.',
    params: { id: str('UUID loan.'), amount, wallet_name: walletName, description: str('Catatan.'), date: date() },
    required: ['id', 'amount', 'wallet_name'] },

  // ── Tabungan (Pro) ──
  { name: 'create_savings', method: 'POST', pro: true,
    summary: 'Buat target tabungan.',
    params: {
      name: str('Nama target.'), target_amount: num('Target dalam Rupiah.'),
      current_amount: num('Isi awal.'), target_date: date('Tanggal target.'),
      description: str('Keterangan.'), category: str('Kategori tabungan.'),
    }, required: ['name', 'target_amount'] },
  { name: 'savings_deposit', method: 'POST', pro: true,
    summary: 'Setor ke tabungan: dompet berkurang, tabungan bertambah.',
    params: { savings_id: str('UUID tabungan.'), amount, wallet_name: walletName, description: str('Catatan.'), date: date() },
    required: ['savings_id', 'amount', 'wallet_name'] },
  { name: 'savings_withdraw', method: 'POST', pro: true,
    summary: 'Tarik dari tabungan: tabungan berkurang, dompet bertambah.',
    params: { savings_id: str('UUID tabungan.'), amount, wallet_name: walletName, description: str('Catatan.'), date: date() },
    required: ['savings_id', 'amount', 'wallet_name'] },

  // ── Anggaran & aset (Pro) ──
  { name: 'create_budget', method: 'POST', pro: true,
    summary: 'Buat anggaran per kategori.',
    params: {
      category: str('Nama kategori pengeluaran.'), amount,
      period: str('monthly, weekly, custom, atau date_range.', { enum: ['monthly', 'weekly', 'custom', 'date_range'] }),
      start_date: date('Mulai (untuk custom/date_range).'), end_date: date('Selesai (untuk custom/date_range).'),
    }, required: ['category', 'amount', 'period'] },
  { name: 'create_asset', method: 'POST', pro: true,
    summary: 'Catat aset baru.',
    params: {
      name: str('Nama aset.'), category: str('emas, saham, properti, kendaraan, dll.'),
      initial_value: num('Nilai beli.'), current_value: num('Nilai sekarang.'),
      purchase_date: date('Tanggal beli.'), quantity: num('Jumlah unit.'),
      unit_type: str('gram, lembar, unit, dll.'), is_divisible: bool('Bisa dijual sebagian.'),
    }, required: ['name', 'initial_value'] },
  { name: 'update_asset_value', method: 'PATCH', pro: true,
    summary: 'Perbarui nilai aset. Riwayat nilai disimpan.',
    params: { id: str('UUID aset.'), value: num('Nilai terbaru.'), date: date() },
    required: ['id', 'value'] },

  // ── Hapus (dua langkah) ──
  ...['transaction', 'wallet', 'category', 'loan'].map((thing) => ({
    name: `delete_${thing}`, method: 'DELETE', destructive: true, pro: thing === 'loan',
    query: ['id', 'confirm'],
    summary: `Hapus ${{ transaction: 'transaksi (saldo dikembalikan)', wallet: 'dompet', category: 'kategori', loan: 'hutang/piutang beserta transaksinya' }[thing]}. Tanpa confirm hanya preview; kirim confirm=true setelah user setuju.`,
    params: {
      id: str(thing === 'wallet' ? 'UUID atau nama dompet.' : 'UUID.'),
      confirm: bool('false atau kosong = preview. true = hapus sungguhan.'),
    },
    required: ['id'],
  })),
];

export const ACTION_BY_NAME = new Map(ACTIONS.map((a) => [a.name, a]));

/** Ambil API key dari env atau file .agq / .env. */
export async function resolveCredentials({ env = process.env, keyFile } = {}) {
  let key = env.KEUANGAN_API_KEY || '';
  let baseUrl = env.KEUANGAN_API_URL || '';
  let file = keyFile || env.KEUANGAN_KEY_FILE;
  if (!file && !key) {
    // Lokasi default yang disarankan di SKILL.md
    const { homedir } = await import('node:os');
    const { existsSync } = await import('node:fs');
    const fallback = `${homedir()}/.config/keuangan-pribadi/keuangan.agq`;
    if (existsSync(fallback)) file = fallback;
  }
  if (file && (!key || !baseUrl)) {
    const { readFile } = await import('node:fs/promises');
    const text = await readFile(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const value = m[2].replace(/^["']|["']$/g, '');
      if (m[1] === 'KEUANGAN_API_KEY' && !key) key = value;
      if (m[1] === 'KEUANGAN_API_URL' && !baseUrl) baseUrl = value;
    }
  }
  return { key, baseUrl: baseUrl || DEFAULT_BASE_URL };
}

/** Panggil satu action. Mengembalikan { ok, status, data }. */
export async function callAction(name, args = {}, { key, baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch } = {}) {
  const action = ACTION_BY_NAME.get(name);
  if (!action) throw new Error(`Action tidak dikenal: ${name}`);
  if (!key) throw new Error('API key kosong. Set KEUANGAN_API_KEY atau KEUANGAN_KEY_FILE (file .agq).');

  const url = new URL(baseUrl);
  url.searchParams.set('action', name);
  const queryFields = new Set(action.method === 'GET' ? Object.keys(action.params) : action.query || []);
  const body = {};
  for (const [k, v] of Object.entries(args)) {
    if (v === undefined || v === null || v === '') continue;
    if (queryFields.has(k)) url.searchParams.set(k, String(v));
    else body[k] = v;
  }

  const init = {
    method: action.method,
    headers: { 'X-API-Key': key, Accept: 'application/json' },
  };
  if (action.method === 'POST' || action.method === 'PATCH') {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const res = await fetchImpl(url, init);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}
