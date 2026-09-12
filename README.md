# 🏏 Cric Chronicles

A kid-friendly, offline-first mobile app for a young cricketer to chronicle every
practice, net, 1-1 coaching, and match session — track skills, mind power,
injuries, and growth — with XP, levels, badges, and focus missions that keep
practice fresh.

## What it does

- **Session wizard (7 quick steps)**: session type → activities done (batting /
  bowling / fielding / fitness drills) → star ratings + scores for batting,
  bowling, fielding, overall → strengths & weaknesses → injury check (with
  "was it preventable?" + prevention lesson) → mind/emotion check-in (feeling,
  mind-strength rating, thoughts) → review & save.
- **Focus missions**: weaknesses logged after a session automatically become
  "practice this twice" missions worth bonus XP — keeping weak areas fresh.
- **Gamification**: XP per session (bonus for honest reflection), 10 cricket
  levels from Debutant to Chronicle Legend, 12 badges, day streaks.
- **Progress charts**: performance trend, all-time skill averages, mind power
  trend — all history preserved forever on the device.
- **Voice input**: every text field (strengths, weaknesses, coach feedback,
  drills, mind thoughts, custom activities…) has a 🎤 button — tap, speak, and
  the words are typed in automatically (uses the browser's built-in speech
  recognition; works best in Chrome; fields still work normally by typing).
- **Coach videos & photos**: open any session in History and attach the
  coach's videos/photos to it — tap to review what actually happened. Media is
  stored on this device (IndexedDB, up to 100MB per file) and is not
  cloud-synced.
- **Action tracking**: the home screen is an action list ("Your Next Plays")
  with one-tap "✔ Practised!" progress; the actions bar and the Rewards tab
  show planned / pending / completed mission counts.
- **Matches get the full treatment**: pre-match personal targets → what
  happened (roles, how out) → free-text personal bests ("first wicket!",
  "10 runs NOT OUT") → structured stats (runs/balls/how out, overs/wickets/
  conceded, catches/run outs, result + margin + opponent) → star ratings →
  retrospective ("what could have been done for a better result?") with
  target achievement check. Achieved targets, wins, personal bests and coach
  praise earn reward points.
- **Cheeku the Cricket 🦗**: mascot who talks to the player at every stage —
  on opening the app, at every wizard step, on saving, and on redemptions.
- **Reward Shop 🎁**: reward points earned for every good thing (targets +5
  each, match wins +10, coach praise +10, mission completes +20, personal
  bests +5) are redeemed for parent-defined rewards (Roblox, McD, Lego,
  dinner out… defaults included; parents add/edit/remove in the Rewards tab).
- **Gentle reminders**: dashboard nudges when sessions lapse; optional daily
  5pm notification if nothing is logged (asks permission after 2 sessions).
- **Data permanence**: everything stored in the browser's localStorage on this
  device. One-tap **Export backup** / **Import backup** (JSON) — export
  regularly and the chronicle can be restored or moved to a new phone, going
  back as far as the data exists.

## Run it

No build tools, no accounts, no server needed:

```bash
cd cricket-progress
python3 -m http.server 8765   # or any static file server
# open http://localhost:8765
```

## Install on a phone (best experience)

1. Open the app URL in Safari (iPhone) or Chrome (Android).
2. iPhone: Share → **Add to Home Screen**. Android: menu → **Install app**.
3. It launches full-screen like a native app and works fully offline
   (service worker caches everything).

> Tip: iOS clears website data if Safari's site data is removed ("Offload
> unused sites" or clearing history). Export a JSON backup regularly — it's
> one tap on the Home screen.

## Data permanence (two layers)

1. **On-device storage** — everything lives in localStorage; works fully offline.
2. **Cloud sync (recommended)** — every session is automatically backed up to a
   free Supabase project. If the phone is lost, broken, or replaced, install
   the app on the new phone, enter the same cloud sync details + chronicle
   code, and the entire history (as far back as it goes) restores — the app
   merges cloud and local data so nothing is lost from either side.

### One-time cloud setup (parent, ~5 minutes, free)

1. Create a free account at [supabase.com](https://supabase.com) and create a
   project (any name, free tier).
2. Open **SQL Editor** in the project and run:

   ```sql
   create table if not exists chronicles (
     code text primary key,
     data jsonb not null,
     updated_at timestamptz not null
   );
   alter table chronicles enable row level security;

   create policy "chronicles access by code" on chronicles
     for all to anon using (true) with check (true);
   ```

3. Copy **Settings → API → Project URL** and the **anon public** key.
4. In the app: Home → ⚙️ Data & Settings → ☁️ Cloud Sync → **Set up cloud
   sync**, paste both values, and keep the suggested chronicle code (or pick
   your own). Done — the app now pushes after every change and pulls on launch.
5. **Create the parent restore link** (one tap, same Cloud Sync card): the app
   generates a single magic link containing all sync details. Save it in the
   parent's phone notes or password manager.

### New or replacement phone (kid needs to know nothing)

1. Parent opens the saved restore link on the new phone.
2. The app configures itself and pulls the entire chronicle from the cloud.
3. Add to Home Screen — done. (Then delete the link from the browser history
   if you like; it's stripped from the address bar automatically.)

> The chronicle code acts as the secret that protects the data — anyone with
> the URL, key *and* code can read/write this chronicle. Use an unguessable
> code and it's fine for a personal cricket diary. Export/import JSON backups
> also still work as a third safety net.

## Files

- `index.html` — app shell
- `js/storage.js` — localStorage persistence + export/import
- `js/wizard.js` — the 7-step session logger
- `js/gamification.js` — XP, levels, badges, streaks, missions
- `js/views.js` — Home / History / Rewards screens
- `js/charts.js` — dependency-free SVG charts
- `js/app.js` — routing, toasts, modals, reminders
- `css/styles.css` — kid-friendly mobile UI
- `sw.js`, `manifest.json`, `icons/` — PWA offline + install support
