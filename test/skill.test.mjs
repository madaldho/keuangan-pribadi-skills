import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ACTIONS, callAction, resolveCredentials } from '../skills/keuangan-pribadi/scripts/actions.mjs';

const MCP = new URL('../skills/keuangan-pribadi/scripts/mcp.mjs', import.meta.url).pathname;

function fakeFetch(calls) {
  return async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
}

test('GET mengirim parameter lewat query, tanpa body', async () => {
  const calls = [];
  await callAction('transactions', { search: 'kopi', limit: 5 }, { key: 'kp_x', fetchImpl: fakeFetch(calls) });
  const u = new URL(calls[0].url);
  assert.equal(u.searchParams.get('action'), 'transactions');
  assert.equal(u.searchParams.get('search'), 'kopi');
  assert.equal(u.searchParams.get('limit'), '5');
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.body, undefined);
  assert.equal(calls[0].init.headers['X-API-Key'], 'kp_x');
});

test('POST mengirim body JSON', async () => {
  const calls = [];
  await callAction('create_transaction', { amount: 15000, type: 'expense', wallet_name: 'Cash' },
    { key: 'kp_x', fetchImpl: fakeFetch(calls) });
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), { amount: 15000, type: 'expense', wallet_name: 'Cash' });
});

test('DELETE: id dan confirm masuk query', async () => {
  const calls = [];
  await callAction('delete_transaction', { id: 'abc', confirm: true }, { key: 'kp_x', fetchImpl: fakeFetch(calls) });
  const u = new URL(calls[0].url);
  assert.equal(u.searchParams.get('id'), 'abc');
  assert.equal(u.searchParams.get('confirm'), 'true');
  assert.equal(calls[0].init.method, 'DELETE');
});

test('tanpa key langsung gagal, tidak memanggil jaringan', async () => {
  const calls = [];
  await assert.rejects(callAction('usage', {}, { key: '', fetchImpl: fakeFetch(calls) }), /API key kosong/);
  assert.equal(calls.length, 0);
});

test('kredensial dibaca dari file .agq', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kp-'));
  const file = join(dir, 'keuangan.agq');
  writeFileSync(file, '# komentar\nKEUANGAN_API_KEY=kp_file\nKEUANGAN_API_URL="https://contoh.test/api"\n');
  const c = await resolveCredentials({ env: {}, keyFile: file });
  rmSync(dir, { recursive: true });
  assert.deepEqual(c, { key: 'kp_file', baseUrl: 'https://contoh.test/api' });
});

test('setiap action punya method dan required yang valid', () => {
  for (const a of ACTIONS) {
    assert.ok(['GET', 'POST', 'PATCH', 'DELETE'].includes(a.method), a.name);
    for (const r of a.required || []) assert.ok(r in a.params, `${a.name}.${r}`);
  }
});

test('MCP: initialize dan tools/list lewat stdio', async () => {
  const child = spawn(process.execPath, [MCP], { env: { ...process.env, KEUANGAN_API_KEY: 'kp_test' } });
  let out = '';
  child.stdout.on('data', (d) => (out += d));
  child.stdin.end([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'keuangan_tidak_ada' } },
  ].map((m) => JSON.stringify(m)).join('\n') + '\n');
  await new Promise((r) => child.on('close', r));
  const byId = Object.fromEntries(out.trim().split('\n').map((l) => JSON.parse(l)).map((m) => [m.id, m]));
  assert.equal(byId[1].result.serverInfo.name, 'keuangan-pribadi');
  assert.equal(byId[2].result.tools.length, ACTIONS.length);
  const del = byId[2].result.tools.find((t) => t.name === 'keuangan_delete_transaction');
  assert.equal(del.annotations.destructiveHint, true);
  assert.equal(byId[3].error.code, -32602);
});
