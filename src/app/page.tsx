import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import {
  ArrowRight,
  CalendarDays,
  Users,
  Mic2,
  Store,
  QrCode,
  Megaphone,
  Sparkles,
  Award,
  ShieldCheck,
  Globe2,
  Building2,
  GraduationCap,
  Briefcase,
  PlayCircle,
  Lock,
  CheckCircle,
  PhoneCall,
  Mail,
  Rocket,
  ClipboardList,
  PartyPopper,
} from "lucide-react";

export default async function LandingPage() {
  const session = await getSession();

  const primaryCta = session
    ? { href: "/admin", label: "Go to dashboard" }
    : { href: "/login", label: "Sign in" };

  return (
    <main className="bg-white text-ink-900">
      <PublicNav session={session} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 text-white">
        <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(245,179,1,0.45),transparent_55%),radial-gradient(circle_at_85%_85%,rgba(47,116,191,0.55),transparent_55%)]" />
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-28 relative">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs uppercase tracking-wider ring-1 ring-white/20">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                The official UoN event management platform
              </div>
              <h1 className="mt-6 text-4xl sm:text-6xl font-bold leading-[1.05]">
                Host every event under
                <br className="hidden sm:block" />
                <span className="text-accent">one roof.</span>
              </h1>
              <p className="mt-6 text-lg text-white/80 max-w-xl">
                UoN Event Hub is the all-in-one platform institutions, faculties and partner
                organisations use to run conferences, summits and convenings — branded with
                your event, hosted on infrastructure managed by Unity of Nations.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-md bg-accent text-ink-900 px-6 py-3 text-sm font-semibold hover:bg-accent-dark hover:text-white transition-colors"
                >
                  {primaryCta.label} <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#talk-to-us"
                  className="inline-flex items-center gap-2 rounded-md bg-white/10 ring-1 ring-white/30 text-white px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20"
                >
                  <PhoneCall className="h-4 w-4" /> Talk to the team
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-accent" /> No per-attendee fees
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-accent" /> Hosted &amp; supported by UoN
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-accent" /> Up and running in a day
                </span>
              </div>
            </div>

            {/* Stylized hero card */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl bg-white/10 backdrop-blur ring-1 ring-white/20 p-6 shadow-pop">
                <div className="rounded-xl bg-white text-ink-900 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-brand-700 text-white flex items-center justify-center font-bold text-xs">
                      UoN
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-ink-400 uppercase tracking-wider">Live event</div>
                      <div className="font-semibold truncate">Your conference name here</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <Tile label="Sessions" value="48" />
                    <Tile label="Speakers" value="22" />
                    <Tile label="Attendees" value="1.2k" />
                  </div>
                  <div className="rounded-md bg-ink-50 p-3 text-xs text-ink-600">
                    <div className="font-medium text-ink-800 inline-flex items-center gap-1">
                      <QrCode className="h-3 w-3" /> 432 checked in
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-ink-200 overflow-hidden">
                      <div className="h-full bg-brand-700" style={{ width: "65%" }} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-white/95 text-ink-900 p-4 shadow-card flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-accent text-ink-900 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-sm">
                    <div className="font-semibold">Event assistant</div>
                    <div className="text-xs text-ink-500">
                      "The keynote starts at 9:00 in Taifa Hall."
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 h-20 w-20 rounded-2xl bg-accent/30 blur-2xl" />
              <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-2xl bg-brand-500/40 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section id="who" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold">
            Who it's for
          </div>
          <h2 className="mt-2 text-3xl font-bold">
            One platform, every kind of convening.
          </h2>
          <p className="mt-3 text-ink-600">
            Designed for organisations that run real-world and hybrid events and need their
            attendee experience to feel like theirs — not a generic SaaS.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <Audience
            icon={<GraduationCap className="h-5 w-5" />}
            title="Universities &amp; colleges"
            body="Research weeks, alumni reunions, faculty symposia, graduations — co-ordinated centrally, branded individually."
          />
          <Audience
            icon={<Building2 className="h-5 w-5" />}
            title="Partner institutions"
            body="Sister universities, agencies and ministries that want enterprise-grade infrastructure for their own events."
          />
          <Audience
            icon={<Briefcase className="h-5 w-5" />}
            title="Industry &amp; NGOs"
            body="Sponsors, exhibitors and partners that host their own programmes alongside UoN convenings."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-ink-50 border-y border-ink-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-3 gap-12">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold">
                Features
              </div>
              <h2 className="mt-3 text-3xl font-bold leading-tight">
                Everything you need to run a great event.
              </h2>
              <p className="mt-4 text-ink-600">
                One branded hub for the whole attendee journey — registration, programme,
                networking, check-in, broadcasts and post-event on-demand.
              </p>
            </div>
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
              <Feature
                icon={<CalendarDays className="h-5 w-5" />}
                title="Sessions, schedule, on-demand"
                body="Build the full programme. Attendees bookmark sessions, get reminders and re-watch recordings any time."
              />
              <Feature
                icon={<Users className="h-5 w-5" />}
                title="Attendee directory &amp; networking"
                body="One-to-one messaging, connection requests and a searchable directory by name, role or department."
              />
              <Feature
                icon={<QrCode className="h-5 w-5" />}
                title="QR-code check-in"
                body="Every attendee gets a unique QR. Staff scan with any phone — no extra hardware, live progress bar."
              />
              <Feature
                icon={<Sparkles className="h-5 w-5" />}
                title="AI assistant per event"
                body="Upload your programme document. A chatbot answers attendee questions 24/7 from your document only — no hallucinations."
              />
              <Feature
                icon={<Megaphone className="h-5 w-5" />}
                title="Email &amp; in-app broadcasts"
                body="Send schedule changes or last-minute updates to all attendees, speakers or exhibitors with one form."
              />
              <Feature
                icon={<Award className="h-5 w-5" />}
                title="Certificates of attendance"
                body="Auto-generated PDFs once attendees are checked in — branded with your event, downloadable on demand."
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold">
            How it works
          </div>
          <h2 className="mt-2 text-3xl font-bold">From kickoff to closing keynote.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Step
            num={1}
            icon={<PhoneCall className="h-5 w-5" />}
            title="Reach out to the hub admin"
            body="The hub admin team verifies your organisation, agrees on pricing and creates your organizer account."
          />
          <Step
            num={2}
            icon={<Rocket className="h-5 w-5" />}
            title="Spin up your event"
            body="Sign in, drop in a logo and cover image, set the dates, venue and slug — your event URL goes live immediately."
          />
          <Step
            num={3}
            icon={<ClipboardList className="h-5 w-5" />}
            title="Build the programme &amp; invite"
            body="Add sessions, speakers and exhibitors. Upload your attendee list — each person activates with an emailed code."
          />
          <Step
            num={4}
            icon={<PartyPopper className="h-5 w-5" />}
            title="Run the show"
            body="QR check-in at the door, live broadcasts, AI assistant answering questions, on-demand library after."
          />
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">
            Why UoN Event Hub
          </div>
          <h2 className="mt-2 text-3xl font-bold">Not just another event platform.</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Diff
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Tenant isolation"
              body="Every event lives on its own URL with its own branding. No cross-leak between organisers."
            />
            <Diff
              icon={<Globe2 className="h-5 w-5" />}
              title="Built for African convenings"
              body="Africa/Nairobi timezone defaults, mobile-first design and KES-friendly pricing."
            />
            <Diff
              icon={<Lock className="h-5 w-5" />}
              title="Invite-only or open"
              body="Pick per event: strict guest lists with name-and-email verification, or open public registration."
            />
            <Diff
              icon={<PlayCircle className="h-5 w-5" />}
              title="On-demand built in"
              body="Sessions become recordings. Attendees catch up any time, on any device."
            />
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs uppercase tracking-[0.2em] text-brand-700 font-semibold">
            Pricing
          </div>
          <h2 className="mt-2 text-3xl font-bold">Simple, transparent, no surprises.</h2>
          <p className="mt-3 text-ink-600">
            A flat per-event fee covers unlimited sessions, attendees, speakers and exhibitors.
            Hub admin sets pricing — institutional and academic discounts available.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <PlanCard
            name="Per event"
            description="Best for one-off conferences and annual flagships."
            features={[
              "Unlimited sessions &amp; speakers",
              "Unlimited attendees",
              "QR check-in &amp; certificates",
              "AI assistant on your programme",
              "Email broadcasts",
            ]}
          />
          <PlanCard
            name="Department"
            recommended
            description="Best for faculties hosting multiple events per year."
            features={[
              "Everything in Per event",
              "Unlimited events per year",
              "Multiple organizer seats",
              "Priority hub admin support",
              "Custom domain on request",
            ]}
          />
          <PlanCard
            name="Partner institution"
            description="Best for external universities and agencies."
            features={[
              "Everything in Department",
              "Co-branded onboarding",
              "Dedicated success manager",
              "SLA on email delivery",
              "Annual usage review",
            ]}
          />
        </div>
        <p className="text-center text-xs text-ink-400 mt-6">
          Exact pricing is set by the hub admin and shared during onboarding.
        </p>
      </section>

      {/* FINAL CTA */}
      <section id="talk-to-us" className="bg-ink-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">
            Ready to host your next event with UoN?
          </h2>
          <p className="mt-3 text-ink-300 max-w-2xl mx-auto">
            Reach out to the hub admin team — we'll set up your organizer account, walk
            through the platform and have you live in under a day.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <a
              href="mailto:eventhub@uonbieventhub.co.ke"
              className="inline-flex items-center gap-2 rounded-md bg-accent text-ink-900 px-6 py-3 text-sm font-semibold hover:bg-accent-dark hover:text-white transition"
            >
              <Mail className="h-4 w-4" /> eventhub@uonbieventhub.co.ke
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-md bg-white/10 ring-1 ring-white/30 text-white px-6 py-3 text-sm font-semibold backdrop-blur hover:bg-white/20"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

function PublicNav({ session }: { session: unknown }) {
  return (
    <nav className="absolute top-0 inset-x-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" aria-label="UoN Event Hub" className="flex items-center gap-2 text-white">
          <Logo size={40} bg="white" />
          <div className="text-sm leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Unity of Nations
            </div>
            <div className="font-semibold">Event Hub</div>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-white/80">
          <a href="#who" className="hover:text-white">Who it's for</a>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-md bg-white/10 ring-1 ring-white/30 text-white px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20"
            >
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
                Sign in
              </Link>
              <a
                href="#talk-to-us"
                className="rounded-md bg-accent text-ink-900 px-4 py-2 text-sm font-semibold hover:bg-accent-dark hover:text-white transition"
              >
                Book a demo
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function PublicFooter() {
  return (
    <footer className="bg-white border-t border-ink-100 text-ink-600">
      <div className="max-w-6xl mx-auto px-6 py-12 grid sm:grid-cols-4 gap-8 text-sm">
        <div className="sm:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Logo size={36} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
                Unity of Nations
              </div>
              <div className="font-semibold text-ink-900">Event Hub</div>
            </div>
          </div>
          <p className="text-xs max-w-sm">
            The official event management platform of the Unity of Nations —
            available to universities, institutions and partner organisations on a paid basis.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400 mb-3">Platform</div>
          <ul className="space-y-2 text-sm">
            <li><a href="#features" className="hover:text-ink-900">Features</a></li>
            <li><a href="#how" className="hover:text-ink-900">How it works</a></li>
            <li><a href="#pricing" className="hover:text-ink-900">Pricing</a></li>
            <li><Link href="/login" className="hover:text-ink-900">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-400 mb-3">Contact</div>
          <ul className="space-y-2 text-sm">
            <li><a href="mailto:eventhub@uonbieventhub.co.ke" className="hover:text-ink-900">eventhub@uonbieventhub.co.ke</a></li>
            <li><a href="https://uonbieventhub.co.ke" className="hover:text-ink-900">uonbieventhub.co.ke</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100">
        <div className="max-w-6xl mx-auto px-6 py-4 text-xs text-ink-400 flex justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} Unity of Nations. All rights reserved.</span>
          <span>Events, brought together.</span>
        </div>
      </div>
    </footer>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-ink-50 p-2">
      <div className="text-base font-bold text-ink-900">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-500">{label}</div>
    </div>
  );
}

function Audience({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-brand-50 text-brand-700">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-ink-900" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="mt-1 text-sm text-ink-600">{body}</p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-white text-brand-700 ring-1 ring-brand-100">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-ink-900" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="mt-1 text-sm text-ink-600">{body}</p>
    </div>
  );
}

function Diff({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-white/10 ring-1 ring-white/20 text-accent">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/70">{body}</p>
    </div>
  );
}

function Step({
  num,
  icon,
  title,
  body,
}: {
  num: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="relative card p-6">
      <div className="absolute -top-3 -left-3 h-9 w-9 rounded-full bg-accent text-ink-900 font-bold flex items-center justify-center shadow-card">
        {num}
      </div>
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-brand-50 text-brand-700 mt-2">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-ink-900" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="mt-1 text-sm text-ink-600">{body}</p>
    </div>
  );
}

function PlanCard({
  name,
  description,
  features,
  recommended,
}: {
  name: string;
  description: string;
  features: string[];
  recommended?: boolean;
}) {
  return (
    <div
      className={
        recommended
          ? "card p-6 ring-2 ring-brand-700 relative"
          : "card p-6"
      }
    >
      {recommended ? (
        <span className="absolute -top-3 left-6 badge-accent">Recommended</span>
      ) : null}
      <div className="text-xs uppercase tracking-wider text-brand-700 font-semibold">{name}</div>
      <p className="mt-2 text-sm text-ink-600">{description}</p>
      <ul className="mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="inline-flex items-start gap-2 text-ink-700">
            <CheckCircle className="h-4 w-4 text-brand-700 shrink-0 mt-0.5" />
            <span dangerouslySetInnerHTML={{ __html: f }} />
          </li>
        ))}
      </ul>
      <a
        href="#talk-to-us"
        className="mt-6 btn-secondary w-full justify-center"
      >
        Talk to us
      </a>
    </div>
  );
}
