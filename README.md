# ModelaU · questionnaire for instructors (study E2)

Web version of the questionnaire designed in the shared document *Cuestionario para instructores tras el vídeo de ModelaU (E2)*.
Spanish, six pages: presentation + demonstration video, profile and controls (part 0), ModelaU vs conventional chat (A),
the eight mechanisms with a visual reminder each (B), usefulness and adoption (C), preference and open comments (D).

```
server.js            dependency-free Node server: serves public/ (with Range support, so the video can seek) and stores submissions
export.mjs           data/responses.jsonl -> CSV (one row per respondent, variable names as in the design document)
public/              index.html, styles.css, app.js (pages), content.js (all questions and mechanism texts), timeline.js (video moments)
public/video/        modelau_demo_es.mp4, modelau_demo_en.mp4 (silent captioned demonstration)
public/img/          visual reminders (crops of the demonstration frames with a red box)
tools/               make_reminders.py (rebuild img/), sync_timeline.mjs (re-sync video + timeline after re-rendering the video)
data/                responses.jsonl is created on the first submission (not versioned; contains the anonymous answers)
```

## Run

```bash
ADMIN_PASSWORD='choose-a-long-one' REQUIRE_INVITE=1 PORT=3200 node server.js    # http://localhost:3200
node export.mjs > responses.csv                                                # CLI export (or use /admin)
```

Environment variables: `PORT` (default 3200); `ADMIN_PASSWORD` (enables `/admin`; without it the admin area does not exist);
`ADMIN_USER` (optional: the user name the admin panel requires; without it any user name is accepted);
`REQUIRE_INVITE=1` (only people with an unused personal link can submit).

## Deployment

Live at <https://cuestionario.garmendia.eus> on the `garmendia.eus` server (Hetzner).

```
/opt/modelau-survey     clone of this repo (git@github.com:xabigar/modelau-survey.git)
docker                  image modelau-survey-survey, container modelau-survey, restart: unless-stopped
127.0.0.1:3006 -> 3000  port bound to loopback only; ./data is a bind mount so answers survive rebuilds
/etc/nginx/sites-available/modelau-survey   TLS proxy (Let's Encrypt), access_log off
/opt/modelau-survey/.env                    ADMIN_USER, ADMIN_PASSWORD, REQUIRE_INVITE=1  (mode 600, not versioned)
```

Update it:

```bash
ssh root@garmendia.eus
cd /opt/modelau-survey && git pull --ff-only && docker compose up -d --build
curl -s http://127.0.0.1:3006/api/invite?k=x      # {"required":true,...}
```

`data/` is git-ignored: answers and invitation codes never reach the public repository. nginx has `access_log off` so
respondents' IPs are not recorded; keep it that way, and take periodic backups of `data/`.

## Several respondents, one admin

- **Respondents**: each browser is independent; the server appends each submission to `data/responses.jsonl` (one process, no clashes).
- **Admin** (`/admin`, HTTP Basic auth: `ADMIN_USER` + `ADMIN_PASSWORD`; without `ADMIN_USER` any user name is accepted): counters, personal invitation links (generate N, copy, delete
  unused), the list of responses (delete test ones), medians/means/distribution per statement, the open comments, and downloads
  (CSV built in the page, or the raw JSONL).
- **Invitation links** (`/?k=CODE`): the code is checked when the page opens and *consumed after the answers are stored*; it is stored in
  `data/invites.json`, never next to the answers, so a response cannot be traced to a person. Without `REQUIRE_INVITE=1` the page is open and
  anyone with the general link can answer (and answer twice). The invite is spent only once `responses.jsonl` has the row: if writing fails the
  endpoint returns 500 and the link stays usable, so a participant is never lost.
- **Save and resume**: answers autosave in the browser (`localStorage`), so closing the tab or the browser loses nothing on the same device.
  A notice offers to continue or start again. Resuming on another device is not possible (that would need server-side drafts and a resume code).
  The draft is deleted on submit. On a shared computer, the next person at the same browser would see the draft.

Node >= 22, no dependencies. Put it behind HTTPS (e.g. the same reverse proxy as the tool) before sending the link.

## What is stored (and what is not)

Per submission: a random id, the day (no time), the form version (`mu_first` / `chat_first`: order of the two columns in part A, assigned at
random to balance the order), the fraction of the video actually played (`video_pct`, from the browser's played ranges, a control for `watched`),
and the answers. "No lo sé / no se vio en el vídeo" is stored as `null` (missing data, not a value). The server does not log IPs, headers or user
agents and sets no cookies; **a reverse proxy in front of it may log IPs: switch that off or anonymise it.**

## Notes

- The video shows the conventional chat first (as the problem) and ModelaU afterwards; the order of the columns in part A is balanced by `version`.
- Mechanism 4 is "at most three highlights per response" (the server keeps at most three diagram elements per reply; `lib.js`, `parseTutorReply`), shown live in the video. Until 2026-11-10 it was "one scenario at a time" (sequence diagrams only, described on a card); responses sent before then rated it in `B_scenario_rel`/`B_scenario_intr`, which stay at the end of `VARIABLES` so the export keeps them. The admin page labels them as the old mechanism 4.
- Reminders in part B link to the exact moment of the video (`MOMENTS` in `public/content.js`, derived from `timeline.js`). If the video is
  re-rendered, run `node tools/sync_timeline.mjs && python3 tools/make_reminders.py` (the timeline is written by
  `modelau_latex/evaluation/demo/video/build.mjs` to `out/timeline.json`).
- Unanswered scale items are allowed (the consent text says any question can be skipped); the page warns once, then lets the person submit.
