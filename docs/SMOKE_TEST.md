# Post-deploy smoke test

Run this checklist after any significant deploy — especially after applying
migrations or shipping new revenue-adjacent features (tickets, payments,
webhooks). Two roles are exercised: a **superadmin** and an **attendee**.

Time budget: ~20 minutes end-to-end.

---

## 0. Prep (one-time per environment)

- [ ] Vercel env vars set: `AUTH_SECRET`, `DATABASE_URL` (**with** `?pgbouncer=true&connection_limit=1`), `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Optional: `GROQ_API_KEY` (chatbot + AI matcher), `STRIPE_*` and/or `FLW_*` (payments), `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (PWA push)
- [ ] Latest migrations applied: `npm run db:deploy` (from local, pointing at prod DB)
- [ ] Latest deploy shows ✅ Ready on Vercel

## 1. Public + SEO

- [ ] `/` (landing) renders in <2s, no console errors
- [ ] `/sitemap.xml` returns valid XML with the event URLs
- [ ] `/robots.txt` returns 200
- [ ] `/api/e/<slug>/og` returns a PNG (opens as image in a new tab)
- [ ] Favicon appears in the browser tab

## 2. Sign in

- [ ] `/login` renders with the Lockup and no console errors
- [ ] Wrong password → **"Invalid email or password"** banner (not "Sign in failed")
- [ ] Correct password → redirects to `/hub-admin` (SUPERADMIN) or `/admin` (ORGANIZER)
- [ ] `/admin/security` **Change password** works — old password verifies, new one accepted
- [ ] `/admin/security` **Change email** works — password confirms, email updates
- [ ] 2FA: **Set up** → scan QR → enter code → 2FA enabled
- [ ] Sign out, sign in again → gets prompted for TOTP → code accepted
- [ ] Try setting up again while enabled → returns 409 with "turn it off first"
- [ ] `/forgot` → enter email → check inbox → click link → new password works

## 3. Hub admin (superadmin)

- [ ] `/hub-admin` overview shows real counts (no zeros unless legitimate)
- [ ] `/hub-admin/users` — 2FA column shows shield for enabled users; reset button works
- [ ] `/hub-admin/organizers` — can create a new organizer, receives activation email
- [ ] `/hub-admin/events` — full event list; delete-event button works with confirmation
- [ ] `/hub-admin/pricing` — plan editor: create, edit, toggle visibility, delete
- [ ] `/hub-admin/agencies` — create an agency, add a member by email, delete
- [ ] `/hub-admin/audit` — recent actions visible

## 4. Event admin (organizer)

Pick a real published event; substitute `<slug>` and `<eventId>` below.

- [ ] `/admin/events/<eventId>` overview renders — cover, dates, sidebar
- [ ] **Sessions** — create, edit, delete a session
- [ ] **Speakers** — add a speaker with email; "Send portal invite" delivers email
- [ ] **Exhibitors** — add, then "Booth staff" opens the staff editor
- [ ] **Attendees** — invite by email; invitation email arrives
- [ ] **Tickets** — create a paid ticket + a free ticket + one with capacity 1
- [ ] **Promo codes** — create a percent-off code; validate on ticket page (below)
- [ ] **Announcements** — send to all attendees; email delivered
- [ ] **Live engagement** — create a poll; open voting; verify it appears on the session page
- [ ] **Meetings** — placeholder overview loads without errors
- [ ] **Email automations** — enable "registration.confirmation" with default text
- [ ] **Integrations** — create a webhook to a test endpoint (e.g. webhook.site), verify signature on delivery
- [ ] **Translations** — add a `fr` translation; picker appears on event page
- [ ] **Post-event survey** — build a 2-question survey
- [ ] **Custom pages → Build page** — add hero + agenda + FAQ blocks, save, preview

## 5. Attendee flow (fresh browser / private window)

Use a real invited email address you can check.

- [ ] `/e/<slug>/login` — enter email → activation code arrives → enter → set password → signed in
- [ ] Event home page shows real event data, tickets section visible
- [ ] **Get tickets** → pick the free ticket → complete registration → redirected back to `/e/<slug>`
- [ ] Event automation email arrives (registration.confirmation)
- [ ] **Get tickets** → pick the capacity-1 ticket → apply promo code → paid → complete Flutterwave OR Stripe test payment → Registration created via webhook
- [ ] With capacity=1 exhausted, try to buy again with a second attendee → **Join waitlist** appears
- [ ] `/e/<slug>/attendees` — self appears; **People you should meet** panel populates (if GROQ_API_KEY set)
- [ ] **Meetings** — request a meeting with another attendee; recipient gets email + sees request under `/e/<slug>/meetings`
- [ ] **Session detail** → **Q&A** — ask a question, upvote; poll vote works if organizer opened one
- [ ] **Materials** — if speaker uploaded slides, "Slides" button appears

## 6. Speaker portal

Sign in as a speaker (from the invited email).

- [ ] `/speaker` shows the event + assigned sessions
- [ ] Edit bio/photo/social — saves
- [ ] Add slides URL to a session — saves; visible on public session page

## 7. Exhibitor booth

Sign in as an exhibitor staff member.

- [ ] `/exhibitor` lists the booth
- [ ] `/exhibitor/<id>` — QR scanner starts; scan an attendee QR → lead captured
- [ ] Add notes, mark qualified → persists on refresh
- [ ] `/api/exhibitor/<id>/leads/export` downloads CSV

## 8. Webhooks (only if Integrations set up in step 4)

- [ ] Confirm the webhook.site URL received `POST` events for each action above
- [ ] Verify `x-uon-signature` header value matches HMAC-SHA256 of the body with the secret

## 9. PWA (only if VAPID keys set)

- [ ] On a mobile browser, `/e/<slug>` shows the "Install app" bar → install → app opens from home screen
- [ ] After signing in, "Turn on notifications" appears → grant → subscription row exists in `PushSubscription` (verify via DB)

## 10. Roll-back readiness

If something in the smoke test fails:

- Revert the last deploy: Vercel → Deployments → previous deploy → **Promote to Production**
- Revert schema if a migration broke prod: apply an inverse SQL patch. Never edit a committed migration in place — write a new one.

---

## Common failure signatures

| Symptom | Probable cause |
|---|---|
| "Sign in failed" (no reason) with 500 | Old deploy without try/catch — force a redeploy |
| "prepared statement s0 already exists" | Vercel `DATABASE_URL` missing `?pgbouncer=true&connection_limit=1` |
| "column User.foo does not exist" | Migration for `foo` not applied — run `npm run db:deploy` |
| Verify TOTP → 405 method not allowed | Route not in middleware `PUBLIC_EXACT` |
| Webhook fires 401 | Wrong signing hash on the receiver side |
| OG image blank on social preview | `/api/e/<slug>/og` was cached from a previous middleware misconfig — hard reload |
