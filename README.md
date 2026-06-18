# University of Nairobi — Event Hub

The official multi-tenant event management platform for the University of Nairobi. UoN faculties and partner institutions pay to use it; each event lives at its own branded URL, fully isolated from every other event on the platform.

## Three roles

| Role | Where they live | What they can do |
| ---- | --------------- | ---------------- |
| **Hub admin** (`SUPERADMIN`) | `/hub-admin` | Creates organizer accounts, configures platform SMTP and brand name, sees every event/user across the platform |
| **Organizer** (`ORGANIZER` / `ADMIN`) | `/admin` | Creates and runs their own events — sees only what they own |
| **Attendee** (`ATTENDEE`) | `/e/<slug>` | Activates from an invite (or signs up for OPEN events), browses one event's hub — never sees other events or UoN branding |

## Per-event branded URLs

Every event has a unique slug. Attendees go to:

```
/e/<slug>           ← event hub (after activation)
/e/<slug>/login     ← activation page (event cover as background, event logo only, no UoN branding)
/e/<slug>/sessions  ← programme
/e/<slug>/schedule  ← personal schedule + QR check-in code + certificate download
/e/<slug>/speakers  ← speakers
... and so on for ondemand, attendees, discussions, exhibitors, pages, profile-edit, settings, connections, messages
```

The horizontal top navigation bar shows the event's logo on the far left, navigation links in the middle, and notifications/messages/profile menu on the right — the parent platform is only discoverable from the URL itself.

## Tech stack

- **Next.js 14** (App Router, TypeScript, React Server Components)
- **PostgreSQL + Prisma** with route groups for layout isolation
- **Tailwind CSS** + lucide-react icons
- **Email + password auth** with JWT session cookies
- **Groq AI** (free tier) for the per-event chatbot — default model `llama-3.3-70b-versatile`
- **Resend** for transactional email — organizer credentials, activation codes, announcement broadcasts
- **`qrcode`** + **`html5-qrcode`** for QR check-in
- **`pdf-lib`** for server-rendered certificates of attendance
- **`pdf-parse`** + **`mammoth`** for parsing uploaded chatbot knowledge documents

## Prerequisites

- Node.js 18.18+ (or 20+)
- Docker Desktop (for the included Postgres) **or** an existing PostgreSQL 14+ instance
- npm

## Quick start

```bash
# 1. start Postgres + Adminer
docker compose up -d

# 2. install Node dependencies
npm install

# 3. configure env
cp .env.example .env
#   .env.example already points DATABASE_URL at the docker container (port 5433).
#   Generate a real AUTH_SECRET with:
#     node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
#   Optional now (can add later via the UI): GROQ_API_KEY

# 4. create the database schema
npx prisma migrate dev --name init

# 5. seed sample data
npm run db:seed

# 6. run the dev server
npm run dev
```

App at [http://localhost:3000](http://localhost:3000). Adminer (DB browser) at [http://localhost:8080](http://localhost:8080) — **Server: `postgres`**, **Username: `uon`**, **Password: `uon_dev_password`**, **Database: `uon_event_hub`**.

## Demo accounts

All seeded accounts share password **`password123`**.

| Role | Email | Lands on |
| ---- | ----- | -------- |
| Hub admin | `hubadmin@uonbi.ac.ke` | `/hub-admin` |
| Organizer | `organizer@uonbi.ac.ke` | `/admin` |
| Attendees | `attendee1@uonbi.ac.ke` … `attendee8@uonbi.ac.ke` | `/e/uon-research-week-2026` |

Sample event URL: `http://localhost:3000/e/uon-research-week-2026`

## Organizer-account lifecycle

There's no public sign-up for organizers — institutions reach out, pay, and the hub admin provisions their account.

1. Institution emails `eventhub@uonbi.ac.ke`, pays the fee offline.
2. Hub admin signs in to `/hub-admin/organizers`, clicks **New organizer**, fills `name + email + institution + validity period`.
3. System generates a random password and either emails it (if Resend is configured) or shows it once in a reveal modal for secure manual sharing.
4. Organizer signs in at `/login`, lands on `/admin`, and starts creating events.

### Organizer account validity

Each organizer is created with a **validity period** (30 / 90 / 180 / 365 days, or custom, or no expiry). When the period ends:

- The organizer is auto-suspended on next login attempt.
- All of their events become inaccessible — visitors see a branded "event is no longer available" page.
- Records stay in the database for audit; the hub admin can extend the expiry or reactivate from `/hub-admin/organizers → Edit` (the **+30 days / +90 days / +1 year** quick buttons also lift the suspension).

### Event auto-suspension

Independently of organizer expiry, every event is automatically suspended **14 days after its end date**. Attendees who follow the event URL after that see the "no longer available" page with the event's own branding. Set in [`src/lib/event.ts`](src/lib/event.ts) (`SUSPENSION_GRACE_DAYS`).

## Creating an event (organizer)

From `/admin/events/new`:

- Upload separate **event logo** (square mark, used as the brand on the event hub) and **cover image** (wide hero, also the activation page background).
- Pick **Invite-only** (default — paste a `First, Last, Email` list inline) or **Open registration** (anyone with the URL can sign up).
- The event slug becomes the unique URL: `/e/<slug>`. Share that with attendees.

## Attendee activation (invite-only)

The activation page at `/e/<slug>/login` matches the screenshot pattern: event cover image as full-bleed background, white card in the centre with just the event logo + name (no UoN branding).

1. Attendee opens the event URL.
2. Enters first name, last name, email — these must match what the organizer uploaded.
3. Clicks **Next** → API matches against the invite list, generates a 6-digit code, emails it (or shows it on screen if Resend isn't configured yet for development).
4. Enters the code (and a password if it's their first time) → account activated, registered for the event, signed in, dropped into the event hub.

## Hub admin features

`/hub-admin` (only `SUPERADMIN` can reach it):

- **Overview** — KPIs across organizers, events, users + recent activity.
- **[Organizers](src/app/hub-admin/organizers/OrganizersClient.tsx)** — create with credential reveal, edit, reset password, delete.
- **[All events](src/app/hub-admin/events/page.tsx)** — every event, who owns it, mode, attendee URL.
- **[All users](src/app/hub-admin/users/page.tsx)** — every user with role + activation status.
- **[Platform settings](src/app/hub-admin/settings/SettingsForms.tsx)** — brand name + email "From" identity + a "Send test email" button.

## Email — powered by Resend

All transactional email goes through **[Resend](https://resend.com)**. The API key lives in the
`RESEND_API_KEY` env var on the server (not in the DB). The hub admin configures the
**From** name and email at runtime from `/hub-admin/settings → Email`.

Setup:

```bash
# 1. Sign up at https://resend.com and verify your sending domain (e.g. uonbi.ac.ke).
# 2. Create an API key at https://resend.com/api-keys
# 3. Add to .env:
RESEND_API_KEY="re_..."
# Fallback "From" if hub admin hasn't set one in the UI:
RESEND_FROM_EMAIL="events@uonbi.ac.ke"
RESEND_FROM_NAME="UoN Event Hub"
# 4. Hub admin → Platform settings → Email → set From name + From email (must be a verified Resend domain) → Send test email.
```

Emails the system sends:

| Trigger | Who gets it |
| ------- | ----------- |
| Organizer created | The new organizer's email — temporary password + access-valid-until date |
| Hub admin "reset password" | The organizer — fresh temporary password |
| Attendee enters name+email on activation page | The attendee — 6-digit verification code |
| Organizer uploads invitees with "send email" checked | Each invitee — event URL + activation instructions |
| Organizer broadcasts an announcement | Whichever audience they picked |
| **Send test email** button | Whoever the hub admin enters — confirms Resend works |

If `RESEND_API_KEY` is missing, the rest of the app still works — activation codes are returned on screen for development, and organizer credentials are revealed in a modal.

## Announcement broadcasts

`/admin/events/<id>/announcements` — composer with:

- Headline + body
- Audience picker (All attendees / Checked-in only / Speakers / Exhibitors) with live recipient counts
- Channel picker (in-app, email, or both)

On send, the [API](src/app/api/admin/events/[eventId]/announcements/route.ts) resolves recipients, fans out emails via Resend, writes `Notification` rows for in-app, and stores the broadcast on `Announcement` with delivery stats. The page below the composer shows the last 10 broadcasts with sent/failed counts.

## The chatbot (Groq)

Each event has one **knowledge document** the organizer uploads from `/admin/events/<id>` → **Chatbot knowledge base**. PDF, DOCX, TXT, MD all work; text is extracted with `pdf-parse` / `mammoth` and stored on `EventKnowledgeBase`.

Attendees see a floating **Ask the event assistant** button on the event home page. Each question goes through [`/api/chat`](src/app/api/chat/route.ts) to Groq's chat completions API with the uploaded document as system context, so the bot answers from your document only.

```bash
# .env
GROQ_API_KEY="gsk_..."                            # https://console.groq.com/keys
# optional override (defaults to llama-3.3-70b-versatile):
# GROQ_MODEL="llama-3.1-8b-instant"               # fastest
# GROQ_MODEL="openai/gpt-oss-120b"                # higher quality
```

If `GROQ_API_KEY` is missing, the chatbot widget stays disabled with a clear message — everything else works.

## Certificates of attendance

Generated server-side by [`src/lib/certificate.ts`](src/lib/certificate.ts) using `pdf-lib`. Issued to anyone who has been QR-checked-in.

- Attendees download their own from **My Schedule** once they're checked in.
- Organizers issue certificates from `/admin/events/<id>/certificates` — sees eligible (checked-in) and pending (not yet checked in) attendees, click **Download PDF**.
- API: [`GET /api/e/<slug>/certificate`](src/app/api/e/[slug]/certificate/route.ts) (own) or `?userId=<id>` (organizer-issued).

## File uploads

Every image/video/document field has a paste-URL toggle plus drag-and-drop upload. Files go to `public/uploads/<kind>/<random>.<ext>` via [`/api/upload`](src/app/api/upload/route.ts). Limits: images 5MB, videos 100MB, documents 10MB. `public/uploads/**` is git-ignored.

Wired into: event logo, event cover, profile photo, speaker photo, exhibitor logo, session video, chatbot knowledge document.

## Route map

### Public (no auth)

| Path | What |
| ---- | ---- |
| `/` | Marketing landing for the platform (no live events listed) |
| `/login`, `/register` | Central sign-in / sign-up for hub admin + organizers |
| `/e/<slug>/login` | Event-branded activation page (cover as background, event logo only) |
| `/api/e/<slug>/activate/*`, `/api/e/<slug>/register` | Activation/registration APIs |

### Attendee event hub (`/e/<slug>/...`)

Top-nav routes: `page` (home), `sessions`, `sessions/[id]`, `schedule`, `ondemand`, `speakers`, `attendees`, `discussions`, `discussions/[id]`, `exhibitors`, `pages/[pageId]`, `profile-edit`, `settings`, `connections`, `messages` — plus the floating chatbot.

### Organizer dashboard (`/admin/...`)

| Path | What |
| ---- | ---- |
| `/admin` | Overview KPIs + event cards |
| `/admin/events`, `/admin/events/new` | List + create event (with logo + invite list inline) |
| `/admin/events/[id]` | Event detail with share URL card, check-in progress, invite manager, certificates link, chatbot knowledge upload |
| `/admin/events/[id]/sessions` `…/speakers` `…/exhibitors` `…/pages` `…/attendees` | Full CRUD on each |
| `/admin/events/[id]/attendees/invite` | Add/remove invites, resend reminder emails |
| `/admin/events/[id]/announcements` | Broadcast composer + history with delivery stats |
| `/admin/events/[id]/certificates` | Issue PDF certificates per eligible attendee |
| `/admin/check-in` | QR scanner |

### Hub admin (`/hub-admin/...`)

| Path | What |
| ---- | ---- |
| `/hub-admin` | Platform KPIs + recent activity |
| `/hub-admin/organizers` | Create with credential reveal, edit, reset password, delete |
| `/hub-admin/events` | All events across the platform |
| `/hub-admin/users` | All users + roles + activation status |
| `/hub-admin/settings` | Brand name + SMTP + test-email button |

## Data model highlights

- `PlatformConfig` (singleton) — brand + SMTP credentials
- `User.role` — `SUPERADMIN | ADMIN | ORGANIZER | ATTENDEE`; nullable `passwordHash` (set during activation), `pendingCode` + `pendingCodeExpiresAt` for the 6-digit verification flow, `activatedAt`
- `Event` — `slug` (unique URL), `logoUrl` (separate from cover), `attendeeMode (OPEN | INVITE_ONLY)`
- `AttendeeInvite` — per-event `firstName + lastName + email + token`; unique on `(eventId, email)`
- `Announcement` — persisted broadcast log with audience + channels + delivery stats
- `EventKnowledgeBase` + `ChatMessage` — chatbot doc + per-user-per-event history
- `Registration` — one per `(event, user)` with unique `qrToken` for check-in

See [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema.

## Deploying to production — Vercel + Supabase + Truehost

This is the recommended path: **Vercel** for hosting, **Supabase** for the Postgres database
and file storage, **Resend** for email, **Truehost** for the custom domain.

### Step 1 — Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) → **New project**. Pick a region close to your audience (e.g. `eu-central-1` for Africa).
2. Once the project finishes provisioning:
   - **Project Settings → Database → Connection string → Transaction pooler**. Copy it — this becomes your `DATABASE_URL`. Append `?pgbouncer=true&connection_limit=1` at the end.
   - **Connection string → Session pooler** (port 5432). Copy it — this becomes your `DIRECT_URL`. Prisma uses it for migrations.
   - **Project Settings → API**: copy the **Project URL** → `SUPABASE_URL`. Copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (it's a secret, never expose to the browser).
3. **Storage → New bucket → name it `uploads` → set as Public bucket**. This stores user-uploaded images, videos and chatbot documents.

### Step 2 — Get a Resend API key

1. Sign up at [resend.com](https://resend.com) → **API keys → Create**.
2. **Domains → Add domain** → enter `uonbieventhub.co.ke`. Add the DNS records Resend shows you to your **Truehost DNS** dashboard (SPF / DKIM / DMARC). Wait for verification.
3. Copy your API key → `RESEND_API_KEY`. Set `RESEND_FROM_EMAIL=eventhub@uonbieventhub.co.ke` (or any address on the verified domain).

### Step 3 — Get a Groq API key (optional, for the chatbot)

[console.groq.com/keys](https://console.groq.com/keys) → **Create API Key**. Free tier is generous for this use case.

### Step 4 — Push to GitHub and import into Vercel

The repo is at https://github.com/sam-austin-junior/uonbieventhub.

1. Sign in to [vercel.com](https://vercel.com) → **Add New → Project → Import** the GitHub repo. Framework preset is auto-detected as **Next.js**.
2. **Environment Variables** — paste in everything from the table below. Generate `AUTH_SECRET` with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. Hit **Deploy**.

| Variable | Value |
| -------- | ----- |
| `DATABASE_URL` | Supabase Transaction pooler URL + `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase Session pooler URL (port 5432) |
| `AUTH_SECRET` | 32+ char random string |
| `NEXT_PUBLIC_APP_URL` | `https://uonbieventhub.co.ke` |
| `RESEND_API_KEY` | From Resend |
| `RESEND_FROM_EMAIL` | `eventhub@uonbieventhub.co.ke` |
| `RESEND_FROM_NAME` | `UoN Event Hub` |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
| `GROQ_API_KEY` | From Groq (optional) |

### Step 5 — Run the initial migration + seed

From your local machine, with `.env` pointing at the Supabase `DATABASE_URL` + `DIRECT_URL`:

```bash
npx prisma migrate deploy        # creates all tables on Supabase
npm run db:seed                  # seeds the hub admin + sample event
```

After this you should be able to sign in to the live site as `hubadmin@uonbi.ac.ke` /
`password123`. **Change that password immediately** from `/hub-admin/organizers → reset` or
by deleting that user and creating yourself a new SUPERADMIN row in Supabase.

### Step 6 — Wire up the custom domain (uonbieventhub.co.ke)

In Vercel:
1. **Project → Settings → Domains → Add Domain** → `uonbieventhub.co.ke`. Also add `www.uonbieventhub.co.ke` and choose to redirect www → root (or the other way).
2. Vercel shows two DNS records to add at Truehost.

In Truehost's DNS dashboard for `uonbieventhub.co.ke`:
- **A record** — `@` → `76.76.21.21` (Vercel's anycast IP)
- **CNAME record** — `www` → `cname.vercel-dns.com`

Wait 1–10 minutes for DNS to propagate. Vercel auto-provisions a Let's Encrypt SSL certificate once the DNS resolves.

Once the domain is live, set `NEXT_PUBLIC_APP_URL=https://uonbieventhub.co.ke` in Vercel env vars and redeploy.

### Step 7 — Final sanity checks

- [ ] Visit `https://uonbieventhub.co.ke` — landing page renders with the lock icon in the address bar.
- [ ] Sign in as the seeded hub admin → **Platform settings → Email → Send test email** to yourself. Confirm it arrives.
- [ ] Create a test organizer → confirm the credentials email lands.
- [ ] Create a test event with the test organizer → upload a logo + cover image → confirm they're stored on Supabase Storage (visible at Supabase → Storage → uploads).
- [ ] Add a test invitee → open the event URL incognito → activate with the 6-digit code.

### Local development env vars

For local dev (`docker compose up -d`), you don't need Supabase Storage or Resend — uploads fall back to `public/uploads/` and activation codes appear on screen instead of in email. Just set:

```bash
DATABASE_URL="postgresql://uon:uon_dev_password@localhost:5433/uon_event_hub?schema=public"
AUTH_SECRET="<generate>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GROQ_API_KEY="<optional>"
```

### Alternative: self-hosted Docker

If you'd rather host yourself (single VPS) instead of Vercel, a multi-stage `Dockerfile` is included that produces a lean standalone image.

```bash
docker build -t uon-event-hub .
docker run -d --name uon-event-hub \
  -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e AUTH_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.example" \
  -e RESEND_API_KEY="..." \
  -e RESEND_FROM_EMAIL="..." \
  -e RESEND_FROM_NAME="UoN Event Hub" \
  -e GROQ_API_KEY="..." \
  -v uon_uploads:/app/public/uploads \
  uon-event-hub
```

Put nginx / Caddy in front of it to terminate TLS. In this mode you can skip Supabase Storage — the mounted volume persists uploads across container restarts.

### Production checklist

- [ ] `AUTH_SECRET` is 32+ random chars (not the example)
- [ ] `NEXT_PUBLIC_APP_URL` matches your live origin (no trailing slash)
- [ ] Resend sending domain verified; `RESEND_FROM_EMAIL` matches that domain
- [ ] Supabase `uploads` bucket is **Public**
- [ ] Initial seeded hub admin password rotated (or user recreated)
- [ ] Default daily backups enabled on Supabase (Free plan keeps 7 days)
- [ ] (Optional) Set up a cron to clean expired `pendingCode` / `passwordResetToken` rows on `User`

### Dev DB lifecycle (local docker-compose)

```bash
docker compose down              # stop containers, keep data
docker compose down -v           # stop + wipe the volume (fresh DB next time)
```

After a `-v` wipe, re-run `npx prisma migrate dev --name init` and `npm run db:seed`.
