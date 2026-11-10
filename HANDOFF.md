# HANDOFF · Web del cuestionario E2 de ModelaU

Última actualización: 2026-11-07. Para retomar el desarrollo más adelante. El `README.md` explica cómo arrancarla; este documento explica **qué es, por qué está así, qué falta y qué decidir**.

## 1. La idea

El estudio **E2** del paper (CAiSE'27, Design Science Research) pide a instructores de ingeniería del software que juzguen ModelaU. Como no van a usar la herramienta, ven **un vídeo de demostración grabado** y después contestan un cuestionario. Esta web hace las dos cosas en un solo sitio:

1. Presenta el estudio y el consentimiento, y reproduce el **vídeo** (3:58, sin voz, con rótulos; incluye la escena «Primero, el ejercicio» que enseña cómo entra el enunciado) al principio.
2. Recoge el cuestionario en seis pasos, con **recordatorios visuales y descriptivos de cada mecanismo** justo donde se puntúa (captura con recuadro rojo, qué hace, y botón para volver a ver ese momento del vídeo).
3. Guarda las respuestas **de forma anónima** y ofrece un **panel de administración** para ver y descargar los datos.

Lo que se mide (ver la tabla de análisis del documento de diseño):
- **Parte A**: 7 criterios (las 4 dimensiones de Nicol + no da la solución + corrección + utilidad global), cada uno puntuado dos veces (ModelaU y chat convencional), 1–5.
- **Parte B**: para cada uno de los **8 mecanismos**, relevancia para su dimensión e intrusividad *esperada* (1–5), más «todo en un mismo espacio».
- **Parte C**: 6 afirmaciones de adopción (constructos de Tornatzky & Klein).
- **Parte D**: preferencia (ModelaU / chat / me da igual) y 7 preguntas abiertas, incluidas qué cosas han gustado y cuáles no.

Con n = 5–10 el análisis es descriptivo + prueba exacta de Wilcoxon (con n = 5 el p mínimo bilateral es 0,0625; ver `modelau_latex/evaluation/simulated/README.md`).

## 2. Dónde está todo (proyectos hermanos en `~/Desktop/Proyectos/`)

| Carpeta | Qué contiene |
|---|---|
| `modelau_survey/` | **Esta web** |
| `modelau_latex/` | Paper (`paper.tex`, `paper_simulated.tex`), evaluación E1, demo y vídeo |
| `modelau-uml-tutor/` | La herramienta ModelaU (repo git, GitHub `xabigar/modelau-uml-tutor`) |

Fuentes de diseño (documentos compartidos en el conector Docs): *Cuestionario para instructores tras el vídeo de ModelaU (E2)* (id `Qt7cgz7xpgixeckBdnpXdG`) y *Guion del vídeo de demostración de ModelaU* (id `DhzCZaM6DB6kACrdUFmejF`). **El documento del cuestionario manda sobre el texto**: si cambia una pregunta, se cambia en `public/content.js` y en el documento.

## 3. Estructura de la web

```
server.js            Servidor Node >= 22 sin dependencias: estáticos (con Range, para poder saltar en el vídeo), envíos, invitaciones, /admin
export.mjs           data/responses.jsonl -> CSV (una fila por respondiente, una columna por variable)
public/index.html    esqueleto: cabecera con progreso, <main id="app">, botón flotante «Ver el vídeo», diálogo de vídeo
public/app.js        lógica de las 6 páginas, escalas, borrador, vídeo, envío
public/content.js    TODO el contenido (preguntas, mecanismos, definiciones de Nicol, momentos del vídeo, VARIABLES). Se importa también desde Node
public/timeline.js   inicio y duración de cada escena del vídeo (generado, no editar a mano)
public/styles.css    estilos (acento #a80036, como ModelaU)
public/img/*.png     recordatorios visuales (generados)
public/video/        modelau_demo_es.mp4 y modelau_demo_en.mp4 (≈ 60 MB; generados, no versionar si se usa git)
admin/index.html     panel de administración (solo se sirve tras autenticarse)
tools/make_reminders.py   regenera public/img desde los fotogramas de la demo (necesita Pillow)
tools/sync_timeline.mjs   copia vídeos y timeline.json desde modelau_latex/evaluation/demo/video/out
data/                responses.jsonl e invites.json (se crean solos; NO versionar; contienen las respuestas)
```

### Los seis pasos (`STEPS` en `app.js`)
1. **Presentación y vídeo**: texto de consentimiento, vídeo con capítulos y selector de rótulos (es/en). Registra el % real reproducido (`video_pct`).
2. **Sobre ti y el vídeo** (parte 0): años de docencia, asignaturas (opcional), uso de IA, `watched` (¿lo has visto entero?). *La pregunta de control sobre la multiplicidad se eliminó a petición del usuario.*
3. **ModelaU frente a un chat convencional** (parte A): a la izquierda, las dos respuestas fijas (sticky) con botón al vídeo; a la derecha, filas compactas. Bloques «las cuatro cualidades de Nicol» y «otros tres aspectos». El **orden de las columnas se reparte al azar** (`mu_first` / `chat_first`) para compensar el orden de presentación.
4. **Los ocho mecanismos** (parte B): cuadro con las 4 definiciones de Nicol; una tarjeta por mecanismo (visual + qué hace + «qué mirar» + las 2 escalas). Cada afirmación de relevancia lleva debajo la definición de la dimensión. El mecanismo 4 (secuencia) se etiqueta «explicado con una tarjeta, no se ve en vivo».
5. **Utilidad y adopción** (parte C).
6. **Preferencia y comentarios** (parte D) + envío.

### Decisiones de diseño que conviene recordar
- **Definiciones de Nicol**: son las del paper (kernel theory) en lenguaje llano (`DIMS` en `content.js`). Evitan puntuar «específica» sin explicar qué significa.
- **«No lo sé / no se vio en el vídeo»** se guarda como `null` (dato ausente), nunca como un valor.
- **Intrusividad «esperada»**: se pide así porque no se ha usado la herramienta.
- **Ninguna pregunta es obligatoria** (el consentimiento lo promete). Al enviar, un único aviso lista cuántas afirmaciones quedan sin puntuar; la segunda pulsación envía.
- El **vídeo empieza por el chat convencional** (como problema) y después presenta ModelaU. Por eso el contrabalanceo es del orden de las *columnas* de la parte A.
- Las capturas de los recordatorios son de la **interfaz en inglés** de ModelaU (la herramienta está en inglés en el estudio); los textos de la web están en español.

## 4. Administración

Arranque típico:

```bash
ADMIN_PASSWORD='una-larga-y-propia' REQUIRE_INVITE=1 PORT=3200 node server.js
```

| Variable | Efecto |
|---|---|
| `PORT` | Puerto (3200 por defecto) |
| `ADMIN_PASSWORD` | Activa `/admin` (Basic auth: cualquier usuario + esta contraseña). Sin ella, `/admin` no existe |
| `REQUIRE_INVITE=1` | Solo envía quien tenga un enlace personal sin usar. Sin ella, la página está abierta (cualquiera puede enviar, y varias veces) |

**Panel `/admin`**: contadores (respuestas, orden de columnas, % de vídeo visto, invitaciones usadas); generar N invitaciones (enlaces `/?k=CÓDIGO`, copiar uno o todos los sin usar, borrar los sin usar); lista de respuestas (borrar las de prueba); mediana, media y reparto 1–5 por afirmación; comentarios abiertos; descarga **CSV** (se genera en la página) o **JSONL**.

**Invitaciones**: el código se valida al abrir la página (`GET /api/invite?k=`) y se **consume al enviar**. Se guarda en `data/invites.json`, **nunca junto a las respuestas**, así que no se puede saber quién contestó qué.

**Rutas**: `GET /api/invite`, `POST /api/submit`, `GET /admin`, `GET /admin/api/data`, `GET /admin/api/responses.jsonl`, `POST /admin/api/invites`, `POST /admin/api/delete-response`, `POST /admin/api/delete-invite`.

### Qué se guarda (una línea de `responses.jsonl`)

```json
{"id":"uuid","day":"2027-01-15","version":"mu_first|chat_first","video_pct":0.98,"answers":{"exp_years":"6 a 10","A_specific_mu":5,"A_specific_chat":2,"B_cite_rel":3,"B_nudge_intr":3,"C_worry":null,"D_prefer":"La de ModelaU","D_why":"…"}}
```

49 variables (`VARIABLES` en `content.js`): `exp_years, courses, ai_use, watched`; `A_{specific,selective,timely,context,withhold,correct,useful}_{mu,chat}`; `B_{cite,highlight,single,cap,nudge,edit_checks,step,vocab}_{rel,intr}`, `B_integrated`; al final, `B_scenario_{rel,intr}` (antiguo mecanismo 4, solo en respuestas anteriores al 10/11); `C_{relative,useful,complex,compat,intent,worry}`; `D_prefer, D_why, D_liked, D_disliked, D_keep, D_missing, D_strict, D_unclear`.

**Privacidad**: no se guarda IP, cabecera ni user agent; no hay cookies; el día va sin hora. **Un proxy inverso delante puede registrar IPs: apagarlo o anonimizarlo.** El borrador vive en `localStorage` del navegador y se borra al enviar.

### Seguridad (estado actual)
- La contraseña de admin se compara en tiempo constante; el fallo espera 500 ms. No hay bloqueo por intentos.
- Basic auth sobre HTTP es inseguro: **HTTPS obligatorio** en producción.
- Los POST de admin usan `application/json` (el navegador exige preflight, que el servidor no atiende), lo que evita CSRF desde otros sitios.
- Límite de 200 KB por envío y de 120 claves; las claves se filtran con una lista de caracteres, pero **no se valida contra `VARIABLES`**.

## 5. Guardar y retomar
- Autoguardado en `localStorage` en cada cambio (con respaldo a `sessionStorage` si no hay). Al volver aparece «Hemos recuperado tu borrador» (seguir / empezar de nuevo).
- **Limitaciones**: solo en el mismo dispositivo y navegador; en un equipo compartido, el siguiente usuario vería el borrador. Retomar en otro dispositivo exigiría borradores en el servidor con un código de reanudación (no hecho).

## 6. Cómo regenerar el material
- **Vídeo** (en `modelau_latex/evaluation/demo/video`): `node build.mjs es|en` y `hyperframes render` (ejecutar con `PATH="$PWD/bin:$PATH"` desde esa carpeta, donde están `ffmpeg-static` y `ffprobe-static`; más detalle en `evaluation/demo/README.md`). `build.mjs` escribe `out/timeline.json`.
- **Sincronizar la web con un vídeo nuevo**: `node tools/sync_timeline.mjs && python3 tools/make_reminders.py`. Si cambian las escenas, revisar `MOMENTS` en `content.js` (inicio y duración del trozo que abre cada botón «Ver este momento»).
- **Recordatorios visuales**: dependen de `frames/*.png` de `evaluation/demo`; las cajas rojas están en coordenadas del recorte (`tools/make_reminders.py`). Si se recaptura la demo y cambian las posiciones, ajustarlas.
- **Probar en local**: la vista previa del entorno usa la config `modelau-survey` de `modelau-uml-tutor/.claude/launch.json` (ignorado por git), que lleva una contraseña **de prueba** (`admin-test`) y `REQUIRE_INVITE=1`. No es la de producción.

## 7. Estado y pendientes

Hecho y probado en navegador y con `curl`: seis pasos, escalas, vídeo con salto a momentos, envío, borrador y reanudación, panel de admin, invitaciones de un solo uso, CSV/JSONL.

**No hecho / por revisar**
- [x] **Desplegado** en https://cuestionario.garmendia.eus (`/opt/modelau-survey`, contenedor `modelau-survey`, `127.0.0.1:3006`, nginx con `access_log off`). Repo público: https://github.com/xabigar/modelau-survey. Pendiente: copia periódica de `data/`.
- [ ] Probar en **móviles reales** y con lector de pantalla (hay `role=radiogroup`, `aria-label` y foco visible, pero no se ha auditado).
- [ ] **Decisión de la página 3** (parte A): se rehízo (respuestas fijas + filas compactas + bloques «Nicol»/«otros»); el usuario dudaba del diseño anterior. Confirmar que ahora gusta.
- [ ] **¿Los instructores probarán la herramienta?** El usuario comentó que «la van a poder probar». Si E2 pasa a incluir uso real, hay que reescribir §6.2 del paper, el cuestionario (hoy «expected usefulness», no «use») y probablemente añadir SUS/TAM tras el uso.
- [ ] **Tamaño de muestra**: con n = 5 ninguna prueba exacta bilateral baja de p = 0,0625. Valorar reclutar ≥ 8.
- [ ] Texto de **consentimiento**/aprobación ética: está en `renderIntro`; revisar con el comité o la política de la institución (anonimato, uso de datos, derecho a abandonar).
- [ ] Versión del cuestionario en **inglés** (hoy solo español; el vídeo sí tiene rótulos en ambos idiomas).
- [ ] **Script de análisis** para el CSV real: la función `analyse()` y el Wilcoxon exacto están en `modelau_latex/evaluation/scripts/simulate_e2.py`; conviene separarla en `analyze_e2.py` que lea `responses.jsonl` y escriba `stats_e2.json`, y que `make_simulated.py`/el paper real la usen.
- [ ] Validar en el servidor que las claves enviadas pertenecen a `VARIABLES` y los valores a su rango (hoy solo se filtra el formato).
- [ ] Limitar intentos de contraseña de admin y/o añadir un límite de envíos por minuto.
- [ ] `video_pct` solo cuenta el reproductor principal (no el diálogo de «ver este momento»); es un control orientativo, no una prueba.
- [ ] El `watched` es autodeclarado: decidir al analizar si se excluye a quien marque «solo una parte» o tenga `video_pct` bajo (anotarlo en el paper).
- [ ] Publicar `design-principles.md` (`modelau_latex/supplementary/`) en `docs/` del repositorio de la herramienta y comprobar el enlace del paper (hoy marcador simulado en azul).
- [ ] Decidir si los datos anonimizados (CSV) se publican con el material suplementario (quitar `id` si hace falta).

## 8. Cómo retomar en 5 minutos

```bash
cd ~/Desktop/Proyectos/modelau_survey
ADMIN_PASSWORD=prueba REQUIRE_INVITE=1 PORT=3200 node server.js      # http://localhost:3200  y  /admin
```

1. Entra en `/admin`, genera 2 invitaciones, abre una en una ventana privada y rellena el cuestionario.
2. Comprueba en `/admin` que aparece la respuesta y que el enlace figura como usado.
3. Borra los datos de prueba: `rm data/responses.jsonl data/invites.json`.
4. Para cambiar el contenido, edita `public/content.js` (preguntas, mecanismos, definiciones); para el aspecto, `public/styles.css`; para el flujo, `public/app.js`.

## Actualización: previsualización de administración

El panel incluye «Previsualizar cuestionario», que abre `/admin/preview` (requiere autenticación). Permite saltar entre los seis pasos sin invitación; las respuestas viven solo en memoria, no se envían ni alteran el borrador del participante. Las preguntas `D_liked` y `D_disliked` se incluyen automáticamente en los comentarios del panel y en el CSV. Pendiente trasladar las dos preguntas al documento compartido del cuestionario.

## Actualización: invitaciones y borrado

El panel genera un enlace por pulsación. Cada respuesta tiene «Borrar respuesta». «Borrar todas las respuestas» abre un diálogo con el número de respuestas y «Estoy seguro, borrar todas». El endpoint autenticado `POST /admin/api/delete-all-responses` exige `confirm: true` y los IDs actuales; devuelve 409 si la lista ha cambiado antes de confirmar. Borrar respuestas no modifica las invitaciones usadas. Verificado con datos temporales, sin borrar respuestas reales.

## Actualización: preguntas obligatorias y comentarios finales

Perfil (excepto asignatura) y escalas requieren respuesta para avanzar y enviar desde la interfaz. «No lo sé» cuenta como respuesta válida. Los textos abiertos siguen opcionales. La previsualización permite saltar sin responder. El último paso conserva solo `D_liked` y `D_disliked`; se retiraron las preguntas de preferencia, motivo, mecanismos, carencias, configuración y claridad. El consentimiento se actualizó para explicar la obligatoriedad. Pendiente sincronizar estos cambios con el documento compartido. Las descripciones anteriores de preguntas opcionales y parte D están superadas por esta actualización.

## Actualización: acceso opcional a la herramienta

Debajo del vídeo se ofrece un enlace a https://modelau.garmendia.eus en otra pestaña, con instrucciones de LLM settings → Server default → Unlock → guardar, adaptadas del texto para reviewers proporcionado por el usuario. Se presenta como prueba opcional. Revisar el diseño de E2 y la redacción de los ítems de intrusividad esperada si se permite este uso real; actualmente esos ítems siguen refiriéndose a no haber usado la herramienta.
