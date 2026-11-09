// Dependency-free server for the E2 questionnaire: serves public/ (with HTTP Range support so the video can seek) and stores
// anonymous submissions in data/responses.jsonl. It does not log IPs, headers or user agents and sets no cookies.
// Run:  PORT=3200 node server.js        Export:  node export.mjs > responses.csv
import http from 'node:http';
import { createReadStream, statSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomUUID, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const PORT = Number(process.env.PORT || 3200);
mkdirSync(DATA, { recursive: true });
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';          // empty -> /admin is disabled
const ADMIN_USER = process.env.ADMIN_USER || '';                  // empty -> any user name is accepted
const REQUIRE_INVITE = process.env.REQUIRE_INVITE === '1';         // 1 -> only people with an unused personal code can submit
const RESP = path.join(DATA, 'responses.jsonl');
const INV = path.join(DATA, 'invites.json');
const loadInvites = () => { try { return JSON.parse(readFileSync(INV, 'utf8')); } catch { return {}; } };
const saveInvites = o => writeFileSync(INV, JSON.stringify(o, null, 1));
const loadResponses = () => existsSync(RESP) ? readFileSync(RESP, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const hash = x => createHash('sha256').update(String(x)).digest();
function isAdmin(req) {
  if (!ADMIN_PASSWORD) return false;
  const m = /^Basic (.+)$/.exec(req.headers.authorization || ''); if (!m) return false;
  const decoded = Buffer.from(m[1], 'base64').toString('utf8');
  const i = decoded.indexOf(':');
  const user = i === -1 ? '' : decoded.slice(0, i);
  const pass = i === -1 ? decoded : decoded.slice(i + 1);
  const okPass = timingSafeEqual(hash(pass), hash(ADMIN_PASSWORD));
  const okUser = ADMIN_USER ? timingSafeEqual(hash(user), hash(ADMIN_USER)) : true;
  return okPass && okUser;
}
const readBody = (req, res, cb, max = 200000) => {
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > max) { res.writeHead(413); res.end(); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { let b; try { b = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return send(res, 400, 'bad json'); } cb(b); });
};

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.mp4': 'video/mp4', '.json': 'application/json', '.svg': 'image/svg+xml' };
const send = (res, code, body, type = 'text/plain; charset=utf-8') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };

function serveFile(req, res, file) {
  let st; try { st = statSync(file); } catch { return send(res, 404, 'not found'); }
  if (!st.isFile()) return send(res, 404, 'not found');
  const type = MIME[path.extname(file)] || 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    let start = range[1] === '' ? st.size - Number(range[2]) : Number(range[1]);
    let end = range[1] === '' || range[2] === '' ? st.size - 1 : Math.min(Number(range[2]), st.size - 1);
    if (!(start >= 0 && start <= end)) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': st.size, 'Cache-Control': type.startsWith('text') ? 'no-store' : 'public, max-age=3600' });
  createReadStream(file).pipe(res);
}

function clean(answers) {
  const out = {};
  for (const [k, v] of Object.entries(answers || {}).slice(0, 120)) {
    if (!/^[A-Za-z0-9_]{1,40}$/.test(k)) continue;
    if (v === null || typeof v === 'number' || typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, 4000);
  }
  return out;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname === '/api/invite') {          // does this personal code work? (the page asks before showing the form)
    const k = url.searchParams.get('k') || '';
    const inv = loadInvites()[k];
    return send(res, 200, JSON.stringify({ required: REQUIRE_INVITE, valid: !!inv && !inv.used, used: !!inv && !!inv.used }), 'application/json');
  }
  if (req.method === 'POST' && url.pathname === '/api/submit') {
    return readBody(req, res, body => {
      const answers = clean(body.answers);
      if (!Object.keys(answers).length) return send(res, 400, 'empty');
      if (['courses', 'university'].some(key => typeof answers[key] !== 'string' || !answers[key].trim())) {
        return send(res, 400, 'missing required profile answers');
      }
      const submittedAt = new Date().toISOString();
      let inv = null, code = '';
      if (REQUIRE_INVITE) {                                                  // check first, consume only after the answers are safely stored
        inv = loadInvites(); code = String(body.invite || '');
        if (!inv[code]) return send(res, 403, JSON.stringify({ error: 'invalid_invite' }), 'application/json');
        if (inv[code].used) return send(res, 409, JSON.stringify({ error: 'used_invite' }), 'application/json');
      }
      const row = { id: randomUUID(), day: submittedAt.slice(0, 10), submittedAt, version: body.version === 'chat_first' ? 'chat_first' : 'mu_first',
        video_pct: typeof body.video_pct === 'number' ? Math.max(0, Math.min(1, body.video_pct)) : null, answers };
      try {
        appendFileSync(RESP, JSON.stringify(row) + '\n');
      } catch (err) {
        console.error('[submit] could not store the response:', err);
        return send(res, 500, JSON.stringify({ error: 'store_failed' }), 'application/json');
      }
      if (inv) {                                                             // never blocks the response: it is already saved
        try {
          inv[code].used = true; inv[code].usedAt = submittedAt; inv[code].usedDay = submittedAt.slice(0, 10); saveInvites(inv);
        } catch (err) {
          console.error('[submit] response stored but invite could not be marked as used:', code, err);
        }
      }
      send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    });
  }
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
    if (!ADMIN_PASSWORD) return send(res, 404, 'admin disabled (set ADMIN_PASSWORD)');
    if (!isAdmin(req)) { return setTimeout(() => { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="ModelaU questionnaire admin", charset="UTF-8"', 'Content-Type': 'text/plain' }); res.end('authentication required'); }, 500); }
    if (req.method === 'GET' && url.pathname === '/admin/preview') return send(res, 200, readFileSync(path.join(PUBLIC, 'index.html'), 'utf8').replace('<head>', '<head><base href="/">'), 'text/html; charset=utf-8');
    if (req.method === 'GET' && (url.pathname === '/admin' || url.pathname === '/admin/')) return serveFile(req, res, path.join(ROOT, 'admin', 'index.html'));
    if (req.method === 'GET' && url.pathname === '/admin/api/data') {
      const inv = loadInvites();
      return send(res, 200, JSON.stringify({ requireInvite: REQUIRE_INVITE, responses: loadResponses(), invites: Object.entries(inv).map(([code, v]) => ({ code, ...v })) }), 'application/json');
    }
    if (req.method === 'GET' && url.pathname === '/admin/api/responses.jsonl') { res.writeHead(200, { 'Content-Type': 'application/x-ndjson', 'Content-Disposition': 'attachment; filename="responses.jsonl"' }); return res.end(existsSync(RESP) ? readFileSync(RESP) : ''); }
    if (req.method === 'POST' && url.pathname === '/admin/api/invites') return readBody(req, res, body => {
      const n = Math.max(1, Math.min(200, Number(body.n) || 1)); const inv = loadInvites(); const createdAt = new Date().toISOString();
      for (let i = 0; i < n; i++) inv[randomBytes(6).toString('hex')] = { created: createdAt.slice(0, 10), createdAt, used: false };
      saveInvites(inv); send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    });
    if (req.method === 'POST' && url.pathname === '/admin/api/delete-all-responses') return readBody(req, res, body => {
      if (body.confirm !== true || !Array.isArray(body.ids)) return send(res, 400, 'confirmation required');
      const rows = loadResponses();
      const ids = new Set(body.ids);
      if (ids.size !== rows.length || !rows.every(r => ids.has(r.id))) return send(res, 409, 'responses changed');
      writeFileSync(RESP, '');
      return send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    });
    if (req.method === 'POST' && url.pathname === '/admin/api/delete-response') return readBody(req, res, body => {
      const rows = loadResponses().filter(r => r.id !== body.id); writeFileSync(RESP, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
      send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    });
    if (req.method === 'POST' && url.pathname === '/admin/api/delete-invite') return readBody(req, res, body => {
      const inv = loadInvites(); if (inv[body.code] && !inv[body.code].used) delete inv[body.code]; saveInvites(inv); send(res, 200, JSON.stringify({ ok: true }), 'application/json');
    });
    return send(res, 404, 'not found');
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'method not allowed');
  let rel = decodeURIComponent(url.pathname); if (rel === '/') rel = '/index.html';
  const file = path.join(PUBLIC, path.normalize(rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'forbidden');
  serveFile(req, res, file);
});
server.listen(PORT, () => console.log(`questionnaire on http://localhost:${PORT}  (responses -> data/responses.jsonl; admin: ${ADMIN_PASSWORD ? '/admin' : 'disabled'}; invite codes ${REQUIRE_INVITE ? 'required' : 'optional'})`));
