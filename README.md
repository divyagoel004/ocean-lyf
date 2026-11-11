# Hii Mikku ♡ — Our Little Ocean of Letters

A private, two-person web app. Letters live inside glass bottles that float on an animated night ocean.
Either of you can open any bottle, write new letters, reply (the reply stays linked to the original) and
release new bottles that appear on the other person's screen in real time.

**Stack:** React 18 · TypeScript · Vite · Framer Motion · Lucide · Supabase (auth, Postgres, Row Level Security, Realtime) · GitHub Pages + GitHub Actions.
There is no backend server — the browser talks straight to Supabase, and Row Level Security is the lock on the door.

---

## What you get

| Feature | Where |
| --- | --- |
| Welcome screen with camera-zoom transition | `src/pages/Welcome` |
| Animated ocean: sky, stars, moon + glints, 5 wave layers, fireflies, plankton, heart-shaped lights, clouds | `src/components/Ocean` |
| Bottles with independent drift / bob / rotation, hover glow, tooltip, unread glow | `src/components/Bottle` |
| Open sequence: bottle flies to centre → cork pops → paper rolls out → letter unfolds | `src/components/Letter` |
| Composer: title, from/to, 7 moods, live paper preview, preview, save draft, release | `src/components/LetterComposer` |
| Release animation: bottle drops in, splashes, floats off + hearts + message | `src/components/Animations` |
| Collection with filters (all / by me / by Mikku / unread / memories / replies) | `src/pages/Collection` |
| Replies linked to the original, navigable both ways | reader "thread" links |
| Magic-link login, only two allowed emails | `src/pages/Login` + `supabase/schema.sql` |
| Real-time bottles, auto-resync after network loss | `src/hooks/useLetters.ts` |
| Ocean sounds toggle (generated in the browser — no audio files) | `src/hooks/useAmbientSound.ts` |
| Letter counter · "Our Memories" · "Find me a little message ♡" · glowing moon | top bar |
| Reduced-motion support, loading / empty / error / offline states, mobile layout | everywhere |

No demo letters are hard-coded: the ocean starts empty and fills with your real letters.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> → **New project** (free tier is plenty).
2. Open **SQL Editor**.
3. Open `supabase/schema.sql` and **edit the two emails** near the top (`allowed_emails`) to be yours and Mikku's — lowercase.
   These are the only two addresses that can ever sign in. Anyone else is rejected by a database trigger.
4. Paste and run `supabase/schema.sql`, then paste and run `supabase/policies.sql`.
5. **Authentication → Providers → Email**: keep *Email* enabled (magic link). You can turn off "Confirm email" if you like; magic links work either way.
6. **Authentication → URL Configuration**
   - **Site URL:** your deployed address, e.g. `https://YOUR-USER.github.io/YOUR-REPO/`
   - **Redirect URLs** — add both:
     - `https://YOUR-USER.github.io/YOUR-REPO/`
     - `http://localhost:5173/`
7. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
   > Never use or paste the `service_role` key anywhere in this project.

### Is it really private?
- The two emails live in `allowed_emails`, a table with RLS and *no* policies — the browser can't read it.
- Signing in with any other email fails (trigger on `auth.users`), so no stranger can even create an account.
- Every table has RLS: only signed-in members can read letters; only the **sender** can edit or delete their own letters; drafts are private to their author.
- `is_read` can only be changed by the *other* person through the `mark_letter_read()` function — and opening a letter never deletes anything.
- The `anon` role has no access to any table.

---

## 2. Run it locally

```bash
npm install
cp .env.example .env.local      # then fill in the two Supabase values
npm run dev                     # http://localhost:5173
```

`.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BASE_PATH=/
```

Open the site → **Enter Our Little Ocean** → enter your email → click the link in the email.
Open the same site on the other person's device/email and send each other a letter to see the real-time bottle arrive.

Other scripts: `npm run build` (typecheck + production build), `npm run preview`.

---

## 3. Deploy to GitHub Pages

1. Create a GitHub repository and push this project to the `main` branch.
2. **Settings → Pages → Build and deployment → Source: _GitHub Actions_**.
3. **Settings → Secrets and variables → Actions → _Secrets_** → add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (These are public-by-design values — the anon key is safe in the browser because RLS protects the data. The service-role key is never used.)
4. Push to `main` (or run the workflow manually from the **Actions** tab). `.github/workflows/deploy.yml` builds and publishes the site.
5. Your site appears at `https://YOUR-USER.github.io/YOUR-REPO/` — make sure that exact URL is in Supabase **Redirect URLs** (step 1.6).

**Base path:** the workflow sets `VITE_BASE_PATH` to `/<repo-name>/` automatically.
If your repo is named `YOUR-USER.github.io` (a user site served from the root), add a repository **variable**
(*Settings → Secrets and variables → Actions → Variables*) named `VITE_BASE_PATH` with value `/`.

**Routing:** the app uses hash routing (`/#/ocean`), so every page works on GitHub Pages without server rewrites.

---

## 4. Using it

- **Send a Letter ♡** (bottom button) → write, pick a mood, watch the paper preview → **Release Into Ocean ♡**. 
- **Click a bottle** to open it. Hover (or focus) to see who it's from; a pink glow means unread.
- **Send a Reply** inside any letter links the new bottle to the original; both letters show links to each other.
- **Our Little Collection ♡** lists everything chronologically with filters; **Our Memories** shows letters with the *A memory* mood.
- **Find me a little message ♡** opens a random bottle (unread ones first).
- Speaker icon toggles ambient ocean sound (browsers require a click before audio can start).
- Drafts are saved to Supabase *and* backed up on the device, so a bad connection never loses your words.

---

## Project structure

```
src/
  components/
    Ocean/            OceanCanvas (waves, stars, moon, particles), Clouds, OceanBackdrop
    Bottle/           Bottle (floating, interactive), BottleSvg
    Letter/           LetterReader (open sequence), Paper
    LetterComposer/   LetterComposer (+ live preview, drafts)
    Navigation/       AppShell, Navigation, RequireAuth, SetupNotice
    Animations/       BottleDrop, HeartBurst, Toasts
  pages/              Welcome, Login, Ocean, Collection
  hooks/              useAuth, useLetters (realtime), useAmbientSound, OceanContext
  services/           letters.ts (all Supabase queries)
  lib/                supabase client, config, bottle layout, formatting, categories
  styles/             global.css, ocean.css, letter.css, collection.css
  types/
supabase/             schema.sql, policies.sql
.github/workflows/    deploy.yml
public/assets/        favicon.svg
```

## Troubleshooting

- **"Almost there ♡" screen:** the two `VITE_SUPABASE_*` variables weren't present at build time. Add them to `.env.local` (local) or to repository **Secrets** (deploy) and rebuild.
- **Login says the ocean belongs to two people:** that email isn't in `allowed_emails`. Add it (lowercase) via the SQL editor: `insert into public.allowed_emails values ('you@example.com');`
- **Magic link lands on a blank/wrong page:** the exact site URL must be listed under Supabase **Redirect URLs**.
- **Bottles don't appear live:** make sure `schema.sql` ran to the end (it adds `letters` and `bottle_properties` to the `supabase_realtime` publication). The app also re-syncs automatically when the tab regains focus or the network returns.
- **Changing the allowed people later:** edit rows in `allowed_emails`; a new person also needs to sign in once so their profile row is created.
- **Free-tier note:** Supabase pauses free projects after about a week of no activity — just un-pause it in the dashboard.
