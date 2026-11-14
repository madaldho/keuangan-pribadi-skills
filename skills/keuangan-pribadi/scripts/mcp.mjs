#!/usr/bin/env node
// MCP server (stdio) untuk Keuangan Pribadi. Tanpa dependency, Node 18+.
//
// Konfigurasi klien (Claude Desktop, Cursor, Claude Code, dll):
//   command: node
//   args:    ["/path/ke/keuangan-pribadi/scripts/mcp.mjs"]
//   env:     { "KEUANGAN_API_KEY": "kp_..." }   atau   { "KEUANGAN_KEY_FILE": "/path/keuangan.agq" }
//
// Setiap action keuangan-api menjadi satu tool bernama keuangan_<action>.
// stdout hanya untuk JSON-RPC; log ke stderr.

import { createInterface } from 'node:readline';
import { ACTIONS, ACTION_BY_NAME, callAction, resolveCredentials } from './actions.mjs';

const SERVER_INFO = { name: 'keuangan-pribadi', title: 'Keuangan Pribadi', version: '1.0.0' };
const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const PREFIX = 'keuangan_';

const INSTRUCTIONS = [
  'Server ini mengubah data keuangan asli milik user.',
  'Panggil keuangan_context sekali di awal sesi untuk daftar dompet dan kategori.',
  'Untuk setiap aksi tulis: susun draft, tunjukkan ke user, eksekusi hanya setelah user setuju.',
  'Koreksi pakai keuangan_update_transaction, bukan hapus lalu buat ulang.',
  'Tool keuangan_delete_* tanpa confirm hanya preview; kirim confirm=true setelah user setuju.',
  'Kode 403 berarti fitur Pro atau izin key kurang; 429 berarti kuota harian Free habis, jangan ulangi.',
].join(' ');

const log = (...a) => console.error('[keuangan-mcp]', ...a);

function toolFor(a) {
  return {
    name: PREFIX + a.name,
    title: a.name.replace(/_/g, ' '),
    description: a.summary + (a.pro ? ' (Khusus akun Pro.)' : '') + (a.analysis ? ' (Akun Free: 3x per hari.)' : ''),
    inputSchema: {
      type: 'object',
      properties: a.params,
      ...(a.required?.length ? { required: a.required } : {}),
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: !!a.readOnly,
      destructiveHint: !!a.destructive,
      idempotentHint: !!a.readOnly,
      openWorldHint: false,
    },
  };
}

const TOOLS = ACTIONS.map(toolFor);

let credsPromise;
const creds = () => (credsPromise ??= resolveCredentials());

async function handle(msg) {
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      return {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return { tools: TOOLS };
    case 'tools/call': {
      const name = String(params?.name || '');
      const action = ACTION_BY_NAME.get(name.startsWith(PREFIX) ? name.slice(PREFIX.length) : name);
      if (!action) throw rpcError(-32602, `Tool tidak dikenal: ${name}`);
      try {
        const c = await creds();
        const { ok, status, data } = await callAction(action.name, params?.arguments || {}, c);
        const text = JSON.stringify(data, null, 2);
        return {
          content: [{ type: 'text', text: ok ? text : `HTTP ${status}\n${text}` }],
          structuredContent: data && typeof data === 'object' && !Array.isArray(data) ? data : { result: data },
          isError: !ok,
        };
      } catch (e) {
        return { content: [{ type: 'text', text: `Gagal: ${e.message}` }], isError: true };
      }
    }
    default:
      if (id === undefined) return undefined; // notifikasi, abaikan
      throw rpcError(-32601, `Method tidak didukung: ${method}`);
  }
}

function rpcError(code, message) {
  const e = new Error(message);
  e.rpc = { code, message };
  return e;
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

const pending = new Set();
let closed = false;
const maybeExit = () => { if (closed && pending.size === 0) process.exit(0); };

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
    return;
  }
  const isRequest = msg.id !== undefined && msg.id !== null && typeof msg.method === 'string';
  const job = (async () => {
    try {
      const result = await handle(msg);
      if (isRequest) send({ jsonrpc: '2.0', id: msg.id, result: result ?? {} });
    } catch (e) {
      if (isRequest) send({ jsonrpc: '2.0', id: msg.id, error: e.rpc || { code: -32603, message: e.message } });
      else log(e.message);
    }
  })();
  pending.add(job);
  job.finally(() => { pending.delete(job); maybeExit(); });
});
// Selesaikan request yang masih jalan sebelum keluar.
rl.on('close', () => { closed = true; maybeExit(); });

creds().then(
  (c) => { if (!c.key) log('Peringatan: KEUANGAN_API_KEY / KEUANGAN_KEY_FILE belum di-set. tools/call akan gagal.'); },
  (e) => log('Gagal membaca kredensial:', e.message),
);
