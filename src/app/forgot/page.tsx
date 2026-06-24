import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";
import { ForgotForm } from "./ForgotForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-white to-brand-50 flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-ink-700 hover:text-ink-900">
          <Logo size={36} />
          <div className="text-sm leading-tight">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">
              University of Nairobi
            </div>
            <div className="font-semibold">Event Hub</div>
          </div>
        </Link>
        <Link
          href="/login"
          className="text-xs text-ink-500 hover:text-ink-900 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md card p-8 sm:p-10">
          <h1 className="text-2xl font-bold text-ink-900">Forgot your password?</h1>
          <p className="mt-1 text-sm text-ink-500">
            Enter the email on your hub admin or organizer account and we'll send a reset
            link.
          </p>

          <ForgotForm />
        </div>
      </main>

      <footer className="px-6 py-4 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} University of Nairobi
      </footer>
    </div>
  );
}
