import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-ink-50 via-white to-brand-50">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-ink-700 hover:text-ink-900">
          <Logo size={36} />
          <div className="text-sm leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
              University of Nairobi
            </div>
            <div className="font-semibold">Event Hub</div>
          </div>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="inline-flex h-16 w-16 rounded-full bg-brand-100 text-brand-700 items-center justify-center">
            <Compass className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-ink-900">We couldn't find that page</h1>
          <p className="mt-2 text-ink-500">
            The link may be broken, the page may have moved, or you may not have access to it.
            Check the URL or head back to the home page.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link href="/" className="btn-primary">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <Link href="/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} University of Nairobi
      </footer>
    </main>
  );
}
