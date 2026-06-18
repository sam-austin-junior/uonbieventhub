import { CheckInScanner } from "./CheckInScanner";

export default function CheckInPage() {
  return (
    <div className="p-8 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">QR Check-in</h1>
        <p className="text-sm text-ink-500 mt-1">
          Scan attendee QR codes at the registration desk and at session entry points. Each attendee's
          code is in their My Schedule page.
        </p>
      </header>
      <CheckInScanner />
    </div>
  );
}
