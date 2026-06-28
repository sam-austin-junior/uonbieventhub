import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Lockup } from "@/components/Lockup";
import { ArrowLeft, Sparkles, ShieldCheck, Globe2 } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-ink-900 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-ink-900"
            aria-label="UoN Event Hub"
          >
            <Logo size={32} rounded={false} bg="transparent" className="ring-0" />
            <span className="text-sm font-semibold tracking-tight">UoN Event Hub</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left: brand panel */}
        <aside className="hidden lg:flex relative overflow-hidden border-r border-ink-100 bg-ink-50/50 items-center justify-center p-12">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e5ecf6_1px,transparent_1px),linear-gradient(to_bottom,#e5ecf6_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] opacity-60" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-gradient-to-br from-brand-100 via-amber-50/40 to-transparent blur-3xl opacity-70 -z-10" />
          <div className="max-w-md">
            <div className="rounded-3xl bg-white p-10 ring-1 ring-ink-100 shadow-pop flex items-center justify-center">
              <Lockup width={320} priority />
            </div>
            <ul className="mt-10 space-y-4 text-sm">
              <BenefitRow
                icon={<Sparkles className="h-4 w-4" />}
                title="One platform for the whole event"
                body="Sessions, speakers, attendees, broadcasts and certificates — all in one place."
              />
              <BenefitRow
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Tenant-isolated by design"
                body="Every event has its own branded URL with no cross-leak between organisers."
              />
              <BenefitRow
                icon={<Globe2 className="h-4 w-4" />}
                title="Built for any timezone"
                body="Configure per-event time, language and currency. Mobile-first, anywhere."
              />
            </ul>
          </div>
        </aside>

        {/* Right: sign-in form */}
        <section className="flex items-center justify-center px-6 py-16 sm:py-20">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex justify-center mb-8">
              <Lockup width={200} priority />
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
              Welcome back
            </h1>
            <p className="mt-3 text-sm text-ink-600 leading-relaxed">
              Sign in to manage your events. New attendees sign in from the
              event's own URL.
            </p>

            <div className="mt-8">
              <Suspense
                fallback={<div className="h-44 rounded-md bg-ink-50 animate-pulse" />}
              >
                <LoginForm />
              </Suspense>
            </div>

            <div className="mt-10 pt-6 border-t border-ink-100">
              <p className="text-sm text-ink-600">
                <span className="font-medium text-ink-900">New here?</span>{" "}
                Organizer accounts are provisioned by our team to keep events
                secure and isolated.
              </p>
              <a
                href="mailto:eventhub@uonbieventhub.co.ke"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white text-ink-900 px-4 py-2 text-sm font-medium ring-1 ring-ink-200 hover:ring-ink-900 hover:bg-ink-50 transition"
              >
                Request an account
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-ink-400 flex justify-between flex-wrap gap-2">
          <span>© {new Date().getFullYear()} Unity of Nations. All rights reserved.</span>
          <span>Plan. Manage. Connect. Succeed.</span>
        </div>
      </footer>
    </div>
  );
}

function BenefitRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-white text-brand-700 ring-1 ring-ink-100 shrink-0">
        {icon}
      </span>
      <div>
        <div className="text-sm font-semibold text-ink-900">{title}</div>
        <div className="mt-1 text-xs text-ink-600 leading-relaxed">{body}</div>
      </div>
    </li>
  );
}
