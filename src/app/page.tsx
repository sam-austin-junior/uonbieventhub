import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { Lockup } from "@/components/Lockup";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Users,
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
  Mail,
  Rocket,
  ClipboardList,
  PartyPopper,
  PhoneCall,
} from "lucide-react";

export default async function LandingPage() {
  const session = await getSession();
  const primaryCta = session
    ? { href: "/admin", label: "Open dashboard" }
    : { href: "/login", label: "Sign in" };

  return (
    <main className="bg-white text-ink-900 antialiased">
      <PublicNav session={session} />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <BackdropGrid />
        <div className="max-w-6xl mx-auto px-6 pt-28 pb-24 sm:pt-36 sm:pb-32 relative">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-600">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Trusted by Unity of Nations convenings
              </div>
              <h1 className="mt-7 text-[2.75rem] sm:text-6xl lg:text-[4.5rem] font-semibold tracking-tight leading-[1.02] text-ink-900">
                Run world-class
                <br />
                events.{" "}
                <span className="text-brand-700">Beautifully.</span>
              </h1>
              <p className="mt-7 text-lg sm:text-xl text-ink-600 max-w-xl leading-relaxed">
                The all-in-one platform institutions, faculties and partner organisations
                use to host conferences, summits and convenings — branded with your event,
                hosted on infrastructure managed by Unity of Nations.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href={primaryCta.href}
                  className="group inline-flex items-center gap-2 rounded-full bg-ink-900 text-white px-6 py-3 text-sm font-medium hover:bg-ink-800 transition-colors"
                >
                  {primaryCta.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#talk-to-us"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-ink-900 px-6 py-3 text-sm font-medium ring-1 ring-ink-200 hover:ring-ink-900 hover:bg-ink-50 transition"
                >
                  Talk to the team
                </a>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                <Stat value="100%" label="Tenant isolation" />
                <Stat value="< 1 day" label="To go live" />
                <Stat value="0 KES" label="Per-attendee fee" />
              </div>
            </div>

            {/* Right column — lockup card */}
            <div className="relative hidden lg:flex justify-center">
              <div className="relative">
                <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-brand-50 via-white to-amber-50 blur-2xl opacity-70" />
                <div className="relative rounded-3xl bg-white p-12 ring-1 ring-ink-100 shadow-pop">
                  <Lockup width={360} priority />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF / WHO IT'S FOR */}
      <section id="who" className="border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <SectionLabel>Who it's for</SectionLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
              One platform, every kind of convening.
            </h2>
            <p className="mt-4 text-lg text-ink-600 leading-relaxed">
              Designed for organisations that run real-world and hybrid events and need
              their attendee experience to feel like theirs — not a generic SaaS.
            </p>
          </div>
          <div className="mt-14 grid sm:grid-cols-3 gap-px bg-ink-100 rounded-2xl overflow-hidden ring-1 ring-ink-100">
            <Audience
              icon={<GraduationCap className="h-5 w-5" />}
              title="Universities & colleges"
              body="Research weeks, alumni reunions, faculty symposia, graduations — co-ordinated centrally, branded individually."
            />
            <Audience
              icon={<Building2 className="h-5 w-5" />}
              title="Partner institutions"
              body="Sister universities, agencies and ministries that want enterprise-grade infrastructure for their own events."
            />
            <Audience
              icon={<Briefcase className="h-5 w-5" />}
              title="Industry & NGOs"
              body="Sponsors, exhibitors and partners that host their own programmes alongside UoN convenings."
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-ink-100 bg-ink-50/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <SectionLabel>Features</SectionLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
              Everything you need to run a great event.
            </h2>
            <p className="mt-4 text-lg text-ink-600 leading-relaxed">
              One branded hub for the whole attendee journey — registration, programme,
              networking, check-in, broadcasts and post-event on-demand.
            </p>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature
              icon={<CalendarDays className="h-5 w-5" />}
              title="Sessions, schedule, on-demand"
              body="Build the full programme. Attendees bookmark sessions, get reminders and re-watch recordings any time."
            />
            <Feature
              icon={<Users className="h-5 w-5" />}
              title="Attendee directory & networking"
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
              title="Email & in-app broadcasts"
              body="Send schedule changes or last-minute updates to all attendees, speakers or exhibitors with one form."
            />
            <Feature
              icon={<Award className="h-5 w-5" />}
              title="Certificates of attendance"
              body="Auto-generated PDFs once attendees are checked in — branded with your event, downloadable on demand."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
              From kickoff to closing keynote.
            </h2>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
            <Step
              num={1}
              icon={<PhoneCall className="h-4 w-4" />}
              title="Reach out to the hub admin"
              body="The hub admin team verifies your organisation, agrees on pricing and creates your organizer account."
            />
            <Step
              num={2}
              icon={<Rocket className="h-4 w-4" />}
              title="Spin up your event"
              body="Sign in, drop in a logo and cover image, set the dates, venue and slug — your event URL goes live immediately."
            />
            <Step
              num={3}
              icon={<ClipboardList className="h-4 w-4" />}
              title="Build the programme & invite"
              body="Add sessions, speakers and exhibitors. Upload your attendee list — each person activates with an emailed code."
            />
            <Step
              num={4}
              icon={<PartyPopper className="h-4 w-4" />}
              title="Run the show"
              body="QR check-in at the door, live broadcasts, AI assistant answering questions, on-demand library after."
            />
          </div>
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="border-b border-ink-100 bg-ink-50/40">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <SectionLabel>Why UoN Event Hub</SectionLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
              Not just another event platform.
            </h2>
          </div>
          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section id="pricing" className="border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
              Simple, transparent, no surprises.
            </h2>
            <p className="mt-4 text-lg text-ink-600 leading-relaxed">
              A flat per-event fee covers unlimited sessions, attendees, speakers and
              exhibitors. Hub admin sets pricing — institutional and academic discounts
              available.
            </p>
          </div>
          <div className="mt-14 grid lg:grid-cols-3 gap-6">
            <PlanCard
              name="Per event"
              description="Best for one-off conferences and annual flagships."
              features={[
                "Unlimited sessions & speakers",
                "Unlimited attendees",
                "QR check-in & certificates",
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
          <p className="text-center text-sm text-ink-500 mt-8">
            Exact pricing is set by the hub admin and shared during onboarding.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="talk-to-us" className="border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-6 py-24 sm:py-32 text-center">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink-900">
            Ready to host your next event with UoN?
          </h2>
          <p className="mt-5 text-lg text-ink-600 max-w-2xl mx-auto leading-relaxed">
            Reach out to the hub admin team — we'll set up your organizer account, walk
            through the platform and have you live in under a day.
          </p>
          <div className="mt-9 flex justify-center gap-3 flex-wrap">
            <a
              href="mailto:eventhub@uonbieventhub.co.ke"
              className="group inline-flex items-center gap-2 rounded-full bg-ink-900 text-white px-6 py-3 text-sm font-medium hover:bg-ink-800 transition"
            >
              <Mail className="h-4 w-4" />
              eventhub@uonbieventhub.co.ke
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white text-ink-900 px-6 py-3 text-sm font-medium ring-1 ring-ink-200 hover:ring-ink-900 hover:bg-ink-50 transition"
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

/* ---------- Layout pieces ---------- */

function PublicNav({ session }: { session: unknown }) {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          aria-label="UoN Event Hub"
          className="flex items-center gap-2.5 text-ink-900"
        >
          <Logo size={32} rounded={false} bg="transparent" className="ring-0" />
          <span className="text-sm font-semibold tracking-tight">UoN Event Hub</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-sm text-ink-600">
          <a href="#who" className="hover:text-ink-900 transition-colors">Who it's for</a>
          <a href="#features" className="hover:text-ink-900 transition-colors">Features</a>
          <a href="#how" className="hover:text-ink-900 transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-ink-900 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 text-white px-4 py-2 text-sm font-medium hover:bg-ink-800 transition"
            >
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-medium text-ink-700 hover:text-ink-900 hover:bg-ink-50 transition-colors"
              >
                Sign in
              </Link>
              <a
                href="#talk-to-us"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 text-white px-4 py-2 text-sm font-medium hover:bg-ink-800 transition"
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
    <footer className="bg-white text-ink-600">
      <div className="max-w-6xl mx-auto px-6 py-16 grid sm:grid-cols-4 gap-10 text-sm">
        <div className="sm:col-span-2 space-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Logo size={32} rounded={false} bg="transparent" className="ring-0" />
            <span className="text-sm font-semibold tracking-tight text-ink-900">
              UoN Event Hub
            </span>
          </Link>
          <p className="text-sm text-ink-600 max-w-sm leading-relaxed">
            The official event management platform of the Unity of Nations — available
            to universities, institutions and partner organisations on a paid basis.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-ink-400 mb-4 font-semibold">
            Platform
          </div>
          <ul className="space-y-3">
            <li><a href="#features" className="hover:text-ink-900 transition-colors">Features</a></li>
            <li><a href="#how" className="hover:text-ink-900 transition-colors">How it works</a></li>
            <li><a href="#pricing" className="hover:text-ink-900 transition-colors">Pricing</a></li>
            <li><Link href="/login" className="hover:text-ink-900 transition-colors">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-ink-400 mb-4 font-semibold">
            Contact
          </div>
          <ul className="space-y-3">
            <li>
              <a href="mailto:eventhub@uonbieventhub.co.ke" className="hover:text-ink-900 transition-colors">
                eventhub@uonbieventhub.co.ke
              </a>
            </li>
            <li>
              <a href="https://www.uonbieventhub.co.ke" className="hover:text-ink-900 transition-colors">
                www.uonbieventhub.co.ke
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-100">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-ink-400 flex justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} Unity of Nations. All rights reserved.</span>
          <span>Plan. Manage. Connect. Succeed.</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Small pieces ---------- */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-brand-700">
      <span className="inline-block h-px w-6 bg-brand-700" />
      {children}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900">
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-500 leading-tight">{label}</div>
    </div>
  );
}

function BackdropGrid() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5ecf6_1px,transparent_1px),linear-gradient(to_bottom,#e5ecf6_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)] opacity-60" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-gradient-to-br from-brand-50 via-amber-50/30 to-transparent blur-3xl opacity-70" />
    </div>
  );
}

/* ---------- Cards ---------- */

function Audience({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-white p-8 hover:bg-ink-50/50 transition-colors">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed">{body}</p>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-7 ring-1 ring-ink-100 hover:ring-ink-200 hover:shadow-card transition-all">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed">{body}</p>
    </div>
  );
}

function Diff({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-7 ring-1 ring-ink-100">
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-ink-900 text-white">
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed">{body}</p>
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
    <div className="relative">
      <div className="flex items-center gap-3 mb-5">
        <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-ink-900 text-white text-xs font-semibold">
          {num}
        </div>
        <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-brand-50 text-brand-700">
          {icon}
        </div>
      </div>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed">{body}</p>
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
          ? "relative rounded-2xl bg-ink-900 text-white p-8 shadow-pop"
          : "rounded-2xl bg-white p-8 ring-1 ring-ink-100"
      }
    >
      {recommended ? (
        <div className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-accent text-ink-900 px-3 py-1 text-xs font-semibold">
          <Sparkles className="h-3 w-3" />
          Recommended
        </div>
      ) : null}
      <div
        className={
          recommended
            ? "text-xs uppercase tracking-[0.15em] text-accent font-semibold"
            : "text-xs uppercase tracking-[0.15em] text-brand-700 font-semibold"
        }
      >
        {name}
      </div>
      <p className={`mt-3 text-sm leading-relaxed ${recommended ? "text-white/70" : "text-ink-600"}`}>
        {description}
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <CheckCircle
              className={`h-4 w-4 shrink-0 mt-0.5 ${recommended ? "text-accent" : "text-brand-700"}`}
            />
            <span className={recommended ? "text-white/90" : "text-ink-700"}>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href="#talk-to-us"
        className={
          recommended
            ? "mt-8 inline-flex items-center justify-center gap-2 w-full rounded-full bg-accent text-ink-900 px-5 py-2.5 text-sm font-medium hover:bg-accent-dark hover:text-white transition"
            : "mt-8 inline-flex items-center justify-center gap-2 w-full rounded-full bg-ink-900 text-white px-5 py-2.5 text-sm font-medium hover:bg-ink-800 transition"
        }
      >
        Talk to us
        <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
