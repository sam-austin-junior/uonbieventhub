"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Lockup } from "@/components/Lockup";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof console !== "undefined") console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-ink-50 via-white to-amber-50">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-ink-700 hover:text-ink-900">
          <Logo size={36} />
          <div className="text-sm leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
              Unity of Nations
            </div>
            <div className="font-semibold">Event Hub</div>
          </div>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-6">
            <Lockup width={200} />
          </div>
          <div className="inline-flex h-16 w-16 rounded-full bg-amber-100 text-amber-700 items-center justify-center">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-ink-900">Something went wrong</h1>
          <p className="mt-2 text-ink-500">
            The server hit an unexpected error. The team has been notified. You can try the action
            again or head back home.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs font-mono text-ink-400">Ref: {error.digest}</p>
          ) : null}
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <button onClick={reset} className="btn-primary">
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <Link href="/" className="btn-secondary">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </div>
        </div>
      </div>

      <footer className="px-6 py-4 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} Unity of Nations
      </footer>
    </main>
  );
}
