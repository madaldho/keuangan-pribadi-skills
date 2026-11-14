#!/usr/bin/env node
// Validasi skill, tulis ulang references/api.md dari katalog, lalu buat zip di dist/.
//   node scripts/build.mjs          validasi + api.md + zip
//   node scripts/build.mjs --check  validasi saja (gagal kalau api.md basi)

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { ACTIONS, DEFAULT_BASE_URL } from '../skills/keuangan-pribadi/scripts/actions.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(root, 'skills', 'keuangan-pribadi');
const checkOnly = process.argv.includes('--check');
const problems = [];

// 1. Frontmatter SKILL.md
const skill = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
const fm = skill.match(/^---\n([\s\S]*?)\n---\n/);
if (!fm) problems.push('SKILL.md: frontmatter tidak ada');
else {
  if (!/^name: keuangan-pribadi$/m.test(fm[1])) problems.push('SKILL.md: name harus keuangan-pribadi');
  if (!/^description:/m.test(fm[1])) problems.push('SKILL.md: description wajib');
  const desc = fm[1].split(/^description:/m)[1]?.split(/^\w+:/m)[0] || '';
  if (desc.replace(/\s+/g, ' ').trim().length > 1024) problems.push('SKILL.md: description lebih dari 1024 karakter');
}
if (skill.split('\n').length > 500) problems.push('SKILL.md: lebih dari 500 baris');

// 3. Katalog action
const names = new Set();
for (const a of ACTIONS) {
  if (names.has(a.name)) problems.push(`actions.mjs: duplikat ${a.name}`);
  names.add(a.name);
  for (const r of a.required || []) if (!(r in a.params)) problems.push(`actions.mjs: ${a.name} required ${r} tidak ada di params`);
}

// 4. api.md dari katalog
const row = (a) => {
  const fields = Object.entries(a.params).map(([k, s]) => {
    const req = (a.required || []).includes(k) ? '**' : '';
    return `${req}\`${k}\`${req} ${s.type}${s.enum ? ` (${s.enum.join(' \\| ')})` : ''}: ${s.description}`;
  });
  const tags = [a.pro && 'Pro', a.analysis && 'kuota Free 3x/hari', a.destructive && 'dua langkah'].filter(Boolean);
  return [
    `### \`${a.name}\``,
    '',
    `\`${a.method} ?action=${a.name}\`${tags.length ? ` (${tags.join(', ')})` : ''}`,
    '',
    a.summary,
    '',
    ...(fields.length ? fields.map((f) => `- ${f}`) : ['Tanpa parameter.']),
    '',
  ].join('\n');
};
const groups = [
  ['Baca data', (a) => a.readOnly],
  ['Tulis data', (a) => !a.readOnly && !a.destructive],
  ['Hapus', (a) => a.destructive],
];
const apiMd = [
  '# Referensi API',
  '',
  '<!-- Dibuat oleh scripts/build.mjs dari scripts/actions.mjs. Jangan edit manual. -->',
  '',
  `Base URL: \`${DEFAULT_BASE_URL}\``,
  '',
  'Setiap request memakai header `X-API-Key: kp_...`. Action dipilih lewat query',
  '`?action=<nama>`. Untuk `GET` dan `DELETE`, parameter dikirim sebagai query',
  'string. Untuk `POST` dan `PATCH`, parameter dikirim sebagai body JSON.',
  'Field bercetak tebal wajib diisi.',
  '',
  '```bash',
  `curl -s "${DEFAULT_BASE_URL}?action=context" -H "X-API-Key: $KEUANGAN_API_KEY"`,
  '',
  `curl -s -X POST "${DEFAULT_BASE_URL}?action=create_transaction" \\`,
  '  -H "X-API-Key: $KEUANGAN_API_KEY" -H "Content-Type: application/json" \\',
  `  -d '{"amount":15000,"type":"expense","wallet_name":"Cash","category_name":"Makanan"}'`,
  '```',
  '',
  ...groups.flatMap(([title, pick]) => [`## ${title}`, '', ...ACTIONS.filter(pick).map(row)]),
].join('\n');
const apiPath = join(skillDir, 'references', 'api.md');
const current = existsSync(apiPath) ? readFileSync(apiPath, 'utf8') : '';
if (current !== apiMd) {
  if (checkOnly) problems.push('references/api.md basi: jalankan node scripts/build.mjs');
  else writeFileSync(apiPath, apiMd);
}

// 2. Link relatif di semua markdown harus ada
const mdFiles = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name === 'dist') continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.md')) mdFiles.push(p);
  }
};
walk(root);
for (const f of mdFiles) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/\]\(([^)#\s]+)(#[^)]*)?\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:)/.test(target)) continue;
    if (!existsSync(resolve(dirname(f), target))) problems.push(`${f.slice(root.length + 1)}: link rusak ${target}`);
  }
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  process.exit(1);
}
console.log(`✓ skill valid (${ACTIONS.length} action, ${mdFiles.length} markdown)`);

// 5. Zip: folder keuangan-pribadi/ di akar zip (siap upload ke claude.ai atau taruh di ~/.claude/skills)
if (!checkOnly) {
  const dist = join(root, 'dist');
  mkdirSync(dist, { recursive: true });
  const zip = join(dist, 'keuangan-pribadi-skill.zip');
  rmSync(zip, { force: true });
  execFileSync('zip', ['-rqX', zip, 'keuangan-pribadi', '-x', '*.DS_Store'], { cwd: join(root, 'skills') });
  console.log(`✓ ${zip.slice(root.length + 1)}`);

  // Katalog untuk halaman dokumentasi di aplikasi (src/data/agentActions.json)
  const catalog = {
    version: skill.match(/version: "([^"]+)"/)?.[1] || '0.0.0',
    base_url: DEFAULT_BASE_URL,
    actions: ACTIONS.map((a) => ({
      name: a.name, method: a.method, summary: a.summary,
      pro: !!a.pro, readOnly: !!a.readOnly, destructive: !!a.destructive, analysis: !!a.analysis,
      params: Object.entries(a.params).map(([k, s]) => ({
        name: k, type: s.type, description: s.description, required: (a.required || []).includes(k), enum: s.enum || null,
      })),
    })),
  };
  writeFileSync(join(dist, 'actions.json'), JSON.stringify(catalog, null, 2) + '\n');
  console.log('✓ dist/actions.json');
}
