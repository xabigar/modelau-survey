import { SCALE, NA, CHAPTERS, MOMENTS, DIMS, PART0, A, B, B_INTEGRATED, B_INTR, C, D } from './content.js';

const $ = id => document.getElementById(id);
const app = $('app');
const preview = location.pathname === '/admin/preview';
const KEY = 'modelau_e2_draft';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// ---- state (autosaved in this browser, so closing the tab or the browser does not lose the answers) ----------------------------------------------
const fresh = () => ({ step: 0, answers: {}, version: Math.random() < 0.5 ? 'mu_first' : 'chat_first', vlang: 'es', videoPct: 0, shuffle: {}, invite: '' });
let st = fresh();
const store = preview ? null : (() => { try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return localStorage; } catch { try { return sessionStorage; } catch { return null; } } })();
let hadDraft = false;
try { const saved = JSON.parse(store && store.getItem(KEY) || 'null'); if (saved) { st = { ...st, ...saved }; hadDraft = Object.keys(saved.answers || {}).length > 0 || saved.step > 0; } } catch {}
const save = () => { try { store && store.setItem(KEY, JSON.stringify(st)); } catch {} };
const clearDraft = () => { try { store && store.removeItem(KEY); } catch {} };

const STEPS = [
  { title: 'Presentación y vídeo', render: renderIntro },
  { title: 'Sobre ti y el vídeo', render: renderPart0 },
  { title: 'ModelaU frente a un chat convencional', render: renderA },
  { title: 'Los ocho mecanismos', render: renderB },
  { title: 'Utilidad y adopción', render: renderC },
  { title: 'Comentarios sobre ModelaU', render: renderD },
];

// ---- video ------------------------------------------------------------------------------------------------------------------
const src = () => `video/modelau_demo_${st.vlang}.mp4`;
const dlg = $('videoDialog'), dv = $('dlgVideo');
let stopAt = null;
function openVideo(moment, note) {
  stopAt = null;
  const start = moment ? moment.t : 0;
  dv.onloadedmetadata = () => { dv.currentTime = start; dv.play().catch(() => {}); };
  dv.src = src();
  stopAt = moment ? moment.t + moment.len : null;
  $('dlgNote').textContent = note || '';
  $('dlgChapters').innerHTML = CHAPTERS.map(([n, t]) => `<button type="button" data-seek="${t}">${esc(n)} · ${mmss(t)}</button>`).join('');
  dlg.showModal();
}
dv.addEventListener('timeupdate', () => { if (stopAt !== null && dv.currentTime >= stopAt) { dv.pause(); stopAt = null; } });
$('dlgChapters').addEventListener('click', e => { const b = e.target.closest('[data-seek]'); if (b) { stopAt = null; dv.currentTime = Number(b.dataset.seek); dv.play().catch(() => {}); } });
const closeVideo = () => { dv.pause(); dlg.close(); };
$('dlgClose').onclick = closeVideo;
dlg.addEventListener('close', () => dv.pause());
$('floatVideo').onclick = () => openVideo(null, 'Puedes volver a ver cualquier parte del vídeo cuando quieras.');
document.addEventListener('click', e => {
  const w = e.target.closest('[data-moment]'); if (!w) return;
  openVideo(MOMENTS[w.dataset.moment], w.dataset.note || '');
});

// ---- widgets -------------------------------------------------------------------------------------------------------------------
function scale(name) {
  const v = st.answers[name];
  const items = [1, 2, 3, 4, 5].map(i => `<label title="${i} · ${esc(SCALE[i - 1])}"><input type="radio" name="${name}" value="${i}" ${v === i ? 'checked' : ''} aria-label="${i} · ${esc(SCALE[i - 1])}"><span>${i}</span></label>`).join('');
  const na = `<label class="na"><input type="radio" name="${name}" value="na" ${v === 'na' ? 'checked' : ''}><span>${esc(NA)}</span></label>`;
  return `<fieldset class="scale-wrap"><div class="scale" role="radiogroup">${items}${na}</div><div class="ends"><span>1 · ${esc(SCALE[0])}</span><span>5 · ${esc(SCALE[4])}</span></div></fieldset>`;
}
function choice(q) {
  let opts = q.options.map((o, i) => [o, i]);
  if (q.shuffle) { st.shuffle[q.id] ||= opts.map((_, i) => i).sort(() => Math.random() - 0.5); opts = st.shuffle[q.id].map(i => [q.options[i], i]); save(); }
  return `<div class="choices" role="radiogroup">${opts.map(([o]) => `<label class="choice"><input type="radio" name="${q.id}" value="${esc(o)}" ${st.answers[q.id] === o ? 'checked' : ''}><span>${esc(o)}</span></label>`).join('')}</div>`;
}
function field(q) {
  const body = q.type === 'text' ? `<textarea name="${q.id}" aria-label="${esc(q.q)}">${esc(st.answers[q.id] || '')}</textarea>` : choice(q);
  return `<fieldset class="q"><legend class="qtext">${esc(q.q)}</legend>${body}</fieldset>`;
}
const watchBtn = (key, label = 'Ver este momento del vídeo', note = '') => `<button type="button" class="watch" data-moment="${key}" data-note="${esc(note)}">▶ ${label} (${mmss(MOMENTS[key].t)})</button>`;

// ---- steps ---------------------------------------------------------------------------------------------------------------------
let resumed = false;
function renderIntro() {
  return `
  <h1>Una herramienta para aprender UML con un tutor que da pistas, no soluciones</h1>
  <p class="lead">Cuestionario para docentes de modelado · unos 20 minutos</p>
  <div class="notice">
    <p>Gracias por colaborar. Hemos desarrollado <strong>ModelaU</strong>, un espacio de trabajo para aprender UML con un tutor basado en un modelo de lenguaje. Primero verás un vídeo de unos 4 minutos con una demostración de la herramienta sobre un ejercicio nuevo de diagramas de clases. Después te pedimos tu opinión como docente de modelado; no hay respuestas correctas ni incorrectas.</p>
    <p><strong>Tus respuestas son anónimas</strong> y se analizarán de forma agregada. No pedimos tu nombre ni datos de contacto, y el servidor no guarda tu IP. Puedes abandonar cuando quieras. Las preguntas de perfil y las escalas deben responderse para avanzar; en las escalas puedes elegir «No lo sé / no se vio en el vídeo». Los comentarios escritos son opcionales. Al enviar el formulario aceptas que usemos tus respuestas agregadas en una publicación científica.</p>
  </div>
  <section class="card video-wrap" aria-label="Vídeo de demostración">
    <h2>Vídeo de demostración</h2>
    <p class="hint">No tiene voz: los rótulos explican cada escena. Por favor, míralo entero antes de contestar.</p>
    <video id="mainVideo" controls playsinline preload="metadata" src="${src()}"></video>
    <div class="chapters">${CHAPTERS.map(([n, t]) => `<button type="button" data-seekmain="${t}">${esc(n)} · ${mmss(t)}</button>`).join('')}</div>
    <div class="vlang">Rótulos del vídeo: <button type="button" data-vlang="es" aria-pressed="${st.vlang === 'es'}">Español</button><button type="button" data-vlang="en" aria-pressed="${st.vlang === 'en'}">English</button></div>
  </section>
  <section class="notice" aria-labelledby="tryTitle">
    <h2 id="tryTitle">¿Quieres probar ModelaU?</h2>
    <p>Si quieres explorar la herramienta antes de responder, entra en <a href="https://modelau.garmendia.eus" target="_blank" rel="noopener noreferrer">modelau.garmendia.eus ↗</a>. Se abrirá en otra pestaña para que puedas volver a este cuestionario. Probarla es opcional.</p>
    <p>Para utilizar el tutor con el modelo compartido, sin aportar tu propia clave de API:</p>
    <ol>
      <li>Abre <strong>LLM settings</strong>.</li>
      <li>En el proveedor, selecciona <strong>Server default</strong>.</li>
      <li>Introduce la contraseña <code>coffee</code> y pulsa <strong>Unlock</strong>.</li>
      <li>Guarda la configuración.</li>
      <li>En el panel <strong>Exercise / Enunciado</strong>, pulsa <strong>Generate / Generar</strong> para crear un enunciado. Puedes indicar un tema o dejarlo en blanco para uno aleatorio; para una primera prueba, elige complejidad <strong>Simple</strong> y pulsa <strong>Generate / Generar</strong>.</li>
      <li>Empieza a construir el diagrama añadiendo algunas clases y relaciones. Después, pide una pista a <strong>UMLBuddy</strong> y observa cómo utiliza tu enunciado y tu diagrama para ayudarte.</li>
    </ol>
    <p>Cuando termines, vuelve a esta pestaña y continúa con el cuestionario.</p>
  </section>
  <div class="nav"><span></span><button class="primary" data-next>He visto el vídeo · Continuar →</button></div>`;
}
function renderPart0() {
  return `<h1>Sobre ti y el vídeo</h1><p class="lead">Responde las preguntas de perfil para continuar. La asignatura es opcional.</p><div class="card">${PART0.map(field).join('')}</div>${nav()}`;
}
function renderA() {
  const first = st.version === 'mu_first' ? ['mu', 'chat'] : ['chat', 'mu'];
  const who = { mu: 'ModelaU', chat: 'Chat convencional' };
  const row = a => `<fieldset class="arow"><legend class="qtext"><span class="chip dim-${a.nicol ? a.label.replace(' ', '-') : 'extra'}">${esc(a.label)}</span> La retroalimentación ${esc(a.text)}.</legend>
    <div class="row2">${first.map(k => `<div><p class="who ${k}">${who[k]}</p>${scale(`A_${a.key}_${k}`)}</div>`).join('')}</div></fieldset>`;
  const nicol = A.filter(a => a.nicol), extra = A.filter(a => !a.nicol);
  return `<h1>ModelaU frente a un chat convencional</h1>
  <p class="lead">Piensa en la retroalimentación que recibe el estudiante en cada caso. Puntúa cada afirmación, de 1 a 5, para ModelaU y para el chat convencional del vídeo. Las dos respuestas se quedan a la vista mientras contestas.</p>
  <div class="alayout">
    <aside class="compare" aria-label="Las dos respuestas del vídeo">
      <figure><figcaption>Chat convencional <small>(no es ModelaU)</small></figcaption><img src="img/a_chat.png" alt="Respuesta del chat convencional">${watchBtn('chat', 'Ver en el vídeo')}</figure>
      <figure><figcaption>ModelaU</figcaption><img src="img/a_modelau.png" alt="Respuesta de ModelaU">${watchBtn('modelau', 'Ver en el vídeo')}</figure>
    </aside>
    <div class="arows">
      <h2>Las cuatro cualidades de la teoría de Nicol</h2>
      <p class="hint">Nicol (2010) describe así la retroalimentación eficaz. Aquí se puntúa cuánto se cumple cada una.</p>
      ${nicol.map(row).join('')}
      <h2 style="margin-top:26px">Otros tres aspectos</h2>
      ${extra.map(row).join('')}
    </div>
  </div>${nav()}`;
}
function renderB() {
  const dimClass = d => d.replace(' ', '-');
  const cards = B.map((b, i) => `<section class="card mech" aria-labelledby="mh_${b.key}">
    <div class="vis"><img src="img/${b.img}" alt="Recordatorio visual: ${esc(b.name)}"><p class="see">${esc(b.see)}</p>${watchBtn(b.moment, b.live ? 'Ver este momento del vídeo' : 'Ver la tarjeta del vídeo')}</div>
    <div class="body">
      <h3 id="mh_${b.key}">${i + 1}. ${esc(b.name)}</h3>
      <p style="margin:6px 0 0"><span class="chip ${dimClass(b.dim)}">${esc(b.dim)}</span> ${b.live ? '' : '<span class="nolive">Explicado con una tarjeta, no se ve en vivo</span>'}</p>
      <p class="what">${esc(b.what)}</p>
      <fieldset class="q"><legend class="qtext">Este mecanismo ayuda a que la retroalimentación <strong>${esc(DIMS[b.dim].adj)}</strong>.</legend>
        <p class="def dim-${dimClass(b.dim)}"><strong>${esc(b.dim)}:</strong> la retroalimentación ${esc(DIMS[b.dim].def)}. <span>${esc(DIMS[b.dim].why)}</span></p>${scale(`B_${b.key}_rel`)}</fieldset>
      <fieldset class="q"><legend class="qtext">${esc(B_INTR)}</legend>${scale(`B_${b.key}_intr`)}</fieldset>
    </div></section>`).join('');
  const integ = `<section class="card mech"><div class="vis"><img src="img/${B_INTEGRATED.img}" alt="Tutor integrado en el espacio de diseño"><p class="see">${esc(B_INTEGRATED.see)}</p>${watchBtn(B_INTEGRATED.moment)}</div>
    <div class="body"><h3>Todo en un mismo espacio</h3><fieldset class="q" style="margin-top:12px"><legend class="qtext">${esc(B_INTEGRATED.text)}</legend>${scale('B_integrated')}</fieldset></div></section>`;
  const legend = Object.entries(DIMS).map(([k, d]) => `<div class="def dim-${dimClass(k)}"><strong>${esc(k)}</strong><br>${esc(d.def.charAt(0).toUpperCase() + d.def.slice(1))}.</div>`).join('');
  return `<h1>Los ocho mecanismos</h1>
  <p class="lead">Cada mecanismo está pensado para conseguir una de las cuatro cualidades de la retroalimentación eficaz de Nicol. Para cada uno puntúas, de 1 a 5, si cumple esa cualidad y si estorbaría al estudiante. A la izquierda tienes un recordatorio de cómo se veía; con el botón puedes volver a ver ese momento.</p>
  <div class="card"><h2>Las cuatro cualidades, en pocas palabras</h2><div class="deflist">${legend}</div></div>
  ${cards}${integ}${nav()}`;
}
function renderC() {
  return `<h1>Utilidad y adopción</h1><p class="lead">Seis afirmaciones, de 1 a 5, sobre si ves ModelaU útil y adoptable en tu docencia.</p>
  ${C.map(c => `<fieldset class="card q"><legend class="qtext">${esc(c.text)}</legend>${scale(`C_${c.key}`)}</fieldset>`).join('')}${nav()}`;
}
function renderD() {
  return `<h1>Comentarios sobre ModelaU</h1><p class="lead">Todas las preguntas son opcionales: lo que escribas aquí nos ayuda tanto como una puntuación.</p>
  <div class="card">${D.map(field).join('')}</div>
  <p id="submitMsg" class="hint" role="status"></p>
  <div class="nav"><button data-prev>← Atrás</button><button class="primary" id="submitBtn" data-submit>Enviar respuestas</button></div>${saveNote}`;
}
const saveNote = '<p class="hint" style="margin-top:14px">Tus respuestas se guardan solas en este navegador: puedes cerrar y volver más tarde con el mismo enlace (desde el mismo dispositivo).</p>';
const nav = () => `<div class="nav"><button data-prev>← Atrás</button><button class="primary" data-next>Siguiente →</button></div>${saveNote}`;

// ---- render / navigation -------------------------------------------------------------------------------------------------
function render() {
  const s = STEPS[st.step];
  app.innerHTML = s.render();
  if (preview) app.insertAdjacentHTML('afterbegin', `<div class="notice"><p><strong>Previsualización de administración</strong> · Las respuestas de prueba no se guardan ni consumen invitaciones.</p><p>${STEPS.map((step, i) => `<button type="button" data-preview-step="${i}">${i + 1}. ${esc(step.title)}</button>`).join(' ')} <a href="/admin">Volver al panel</a></p></div>`);
  if (resumed) app.insertAdjacentHTML('afterbegin', `<div class="notice" id="resumeNote"><p><strong>Hemos recuperado tu borrador</strong> (paso ${st.step + 1} de ${STEPS.length}). Puedes seguir donde lo dejaste o empezar de nuevo.</p><p><button data-dismiss>Seguir</button> <button data-restart>Empezar de nuevo (borra el borrador)</button></p></div>`);
  $('stepLabel').textContent = `Paso ${st.step + 1} de ${STEPS.length} · ${s.title}`;
  $('barFill').style.width = `${((st.step + 1) / STEPS.length) * 100}%`;
  $('floatVideo').hidden = st.step === 0;
  document.title = `${s.title} · ModelaU`;
  window.scrollTo({ top: 0 });
  app.focus({ preventScroll: true });
  const mv = $('mainVideo');
  if (mv) {
    mv.addEventListener('timeupdate', () => {
      let total = 0; for (let i = 0; i < mv.played.length; i++) total += mv.played.end(i) - mv.played.start(i);
      if (mv.duration) { st.videoPct = Math.max(st.videoPct, Math.min(1, total / mv.duration)); save(); }
    });
  }
}
function validateStep() {
  if (preview) return true;
  const required = st.step === 1 ? PART0.filter(q => q.type !== 'text').map(q => q.id)
    : st.step === 2 ? A.flatMap(a => [`A_${a.key}_mu`, `A_${a.key}_chat`])
    : st.step === 3 ? [...B.flatMap(b => [`B_${b.key}_rel`, `B_${b.key}_intr`]), 'B_integrated']
    : st.step === 4 ? C.map(c => `C_${c.key}`) : [];
  const missing = required.filter(k => st.answers[k] === undefined);
  app.querySelectorAll('[aria-invalid="true"]').forEach(node => node.removeAttribute('aria-invalid'));
  $('validationMsg')?.remove();
  if (!missing.length) return true;
  app.insertAdjacentHTML('afterbegin', `<p id="validationMsg" class="err" role="alert" tabindex="-1">Quedan ${missing.length} preguntas sin responder en este paso. Respóndelas para continuar.</p>`);
  for (const key of missing) app.querySelector(`[name="${key}"]`)?.closest('fieldset')?.setAttribute('aria-invalid', 'true');
  $('validationMsg').focus();
  return false;
}
const go = d => { if (d > 0 && !validateStep()) return; resumed = false; st.step = Math.max(0, Math.min(STEPS.length - 1, st.step + d)); save(); render(); };

app.addEventListener('change', e => {
  const t = e.target; if (!t.name) return;
  if (t.type === 'radio') st.answers[t.name] = /^[1-5]$/.test(t.value) ? Number(t.value) : (t.value === 'na' ? 'na' : t.value);
  save();
});
app.addEventListener('input', e => { const t = e.target; if (t.tagName === 'TEXTAREA' || t.type === 'text') { st.answers[t.name] = t.value; save(); } });
app.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (preview && b.dataset.previewStep !== undefined) { st.step = Number(b.dataset.previewStep); render(); }
  else if (b.hasAttribute('data-next')) go(1);
  else if (b.hasAttribute('data-prev')) go(-1);
  else if (b.dataset.seekmain !== undefined) { const v = $('mainVideo'); v.currentTime = Number(b.dataset.seekmain); v.play().catch(() => {}); }
  else if (b.dataset.vlang) { st.vlang = b.dataset.vlang; save(); const v = $('mainVideo'); const t = v.currentTime; v.src = src(); v.currentTime = t; app.querySelectorAll('[data-vlang]').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.vlang === st.vlang))); }
  else if (b.hasAttribute('data-submit')) submit();
  else if (b.hasAttribute('data-dismiss')) { resumed = false; const n = $('resumeNote'); if (n) n.remove(); }
  else if (b.hasAttribute('data-restart')) { if (confirm('¿Borrar el borrador y empezar de nuevo?')) { const inv = st.invite; clearDraft(); st = fresh(); st.invite = inv; resumed = false; save(); render(); } }
});

// ---- submit ----------------------------------------------------------------------------------------------------------------------
const SCALED = [...A.flatMap(a => [`A_${a.key}_mu`, `A_${a.key}_chat`]), ...B.flatMap(b => [`B_${b.key}_rel`, `B_${b.key}_intr`]), 'B_integrated', ...C.map(c => `C_${c.key}`)];
async function submit() {
  if (preview) { $('submitMsg').textContent = 'Fin de la previsualización. No se han enviado ni guardado respuestas.'; return; }
  const missing = SCALED.filter(k => st.answers[k] === undefined).length;
  const msg = $('submitMsg');
  const missingProfile = PART0.filter(q => q.type !== 'text' && st.answers[q.id] === undefined).length;
  if (missing || missingProfile) {
    msg.textContent = 'Hay preguntas obligatorias sin responder. Revisa los pasos anteriores antes de enviar.';
    return;
  }
  const btn = $('submitBtn'); btn.disabled = true; msg.textContent = 'Enviando…';
  const answers = {}; for (const [k, v] of Object.entries(st.answers)) answers[k] = v === 'na' ? null : v;
  try {
    const r = await fetch('api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers, version: st.version, invite: st.invite, video_pct: Math.round(st.videoPct * 100) / 100 }) });
    if (r.status === 403 || r.status === 409) { btn.disabled = false; msg.innerHTML = '<span class="err">Este enlace personal no es válido o ya se usó.</span> Pide a los autores uno nuevo.'; return; }
    if (!r.ok) throw new Error(String(r.status));
    clearDraft();
    $('floatVideo').hidden = true; $('stepLabel').textContent = 'Enviado'; $('barFill').style.width = '100%';
    app.innerHTML = `<div class="card thanks"><div class="tick" aria-hidden="true">✓</div><h1>Gracias</h1><p>Hemos recibido tus respuestas. Puedes cerrar esta página.</p></div>`;
  } catch {
    btn.disabled = false;
    msg.innerHTML = `<span class="err">No se pudo enviar.</span> Comprueba tu conexión e inténtalo de nuevo. Si sigue fallando, <a href="#" id="dl">descarga tus respuestas</a> y envíalas a los autores.`;
    $('dl').onclick = ev => { ev.preventDefault(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ answers, version: st.version }, null, 1)], { type: 'application/json' })); a.download = 'respuestas_modelau.json'; a.click(); };
  }
}

// ---- start: personal invitation link (?k=...) ---------------------------------------------------------------------------
async function start() {
  if (preview) { render(); return; }
  const k = new URLSearchParams(location.search).get('k');
  if (k) { st.invite = k; save(); history.replaceState(null, '', location.pathname); }
  let info = { required: false, valid: true };
  try { info = await (await fetch('api/invite?k=' + encodeURIComponent(st.invite || ''))).json(); } catch {}
  if (info.required && !info.valid) {
    $('stepLabel').textContent = ''; $('barFill').style.width = '0';
    app.innerHTML = `<div class="card thanks"><h1>${info.used ? 'Este enlace ya se ha usado' : 'Necesitas tu enlace personal'}</h1><p>${info.used ? 'Ya hemos recibido unas respuestas con este enlace. Gracias.' : 'Este cuestionario es por invitación. Abre el enlace que te enviaron los autores.'}</p></div>`;
    return;
  }
  resumed = hadDraft;
  render();
}
start();
