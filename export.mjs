// Exports data/responses.jsonl to CSV (one row per respondent, one column per variable; "No lo sé" is an empty cell).
// Usage:  node export.mjs > responses.csv
import { readFileSync, existsSync } from 'node:fs';
import { VARIABLES } from './public/content.js';

const file = 'data/responses.jsonl';
if (!existsSync(file)) { console.error('no responses yet'); process.exit(1); }
const rows = readFileSync(file, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const cell = v => v === null || v === undefined ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
const head = ['id', 'day', 'version', 'video_pct', ...VARIABLES];
console.log(head.join(','));
for (const r of rows) console.log([r.id, r.day, r.version, r.video_pct, ...VARIABLES.map(v => r.answers[v])].map(cell).join(','));
console.error(`${rows.length} responses exported`);
