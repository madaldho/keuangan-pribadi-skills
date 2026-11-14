#!/usr/bin/env node
// CLI kecil untuk keuangan-api. Tanpa dependency, Node 18+.
//
//   node kp.mjs list                       daftar action
//   node kp.mjs context                    snapshot akun
//   node kp.mjs create_transaction '{"amount":15000,"type":"expense","wallet_name":"Cash"}'
//   node kp.mjs --key-file ~/keuangan.agq usage
//
// Kredensial: KEUANGAN_API_KEY, atau KEUANGAN_KEY_FILE / --key-file menunjuk file .agq.

import { ACTIONS, ACTION_BY_NAME, callAction, resolveCredentials } from './actions.mjs';

const argv = process.argv.slice(2);
let keyFile;
const rest = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--key-file') keyFile = argv[++i];
  else rest.push(argv[i]);
}
const [name, json] = rest;

if (!name || name === 'help' || name === '--help') {
  console.log('Pakai: node kp.mjs [--key-file file.agq] <action> [json]\n       node kp.mjs list');
  process.exit(name ? 0 : 1);
}

if (name === 'list') {
  for (const a of ACTIONS) {
    const tags = [a.method, a.pro && 'Pro', a.destructive && 'hapus'].filter(Boolean).join(', ');
    console.log(`${a.name.padEnd(20)} ${tags.padEnd(16)} ${a.summary}`);
  }
  process.exit(0);
}

if (!ACTION_BY_NAME.has(name)) {
  console.error(`Action tidak dikenal: ${name}. Jalankan "node kp.mjs list".`);
  process.exit(2);
}

let args = {};
if (json) {
  try { args = JSON.parse(json); } catch (e) {
    console.error(`JSON tidak valid: ${e.message}`);
    process.exit(2);
  }
}

try {
  const creds = await resolveCredentials({ keyFile });
  const { ok, status, data } = await callAction(name, args, creds);
  console.log(JSON.stringify(data, null, 2));
  if (!ok) {
    console.error(`HTTP ${status}`);
    process.exit(1);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
