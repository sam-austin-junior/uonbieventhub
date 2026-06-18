"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, AlertCircle, Type } from "lucide-react";

type Result = {
  ok: boolean;
  alreadyCheckedIn?: boolean;
  attendee?: { name: string; email: string; faculty?: string | null };
  checkedInAt?: string;
  error?: string;
};

export function CheckInScanner() {
  const containerId = "qr-scanner-region";
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [manualCode, setManualCode] = useState("");
  const lastScannedRef = useRef<string>("");
  const lastScannedAtRef = useRef<number>(0);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      try {
        scannerRef.current?.stop?.();
      } catch {}
    };
  }, []);

  async function startScanner() {
    setResult(null);
    setScanning(true);
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 } },
      async (decodedText: string) => {
        const now = Date.now();
        if (decodedText === lastScannedRef.current && now - lastScannedAtRef.current < 3000) return;
        lastScannedRef.current = decodedText;
        lastScannedAtRef.current = now;
        await submitToken(decodedText);
      },
      () => {}
    );
  }

  async function stopScanner() {
    try {
      await scannerRef.current?.stop?.();
    } catch {}
    setScanning(false);
  }

  async function submitToken(qrToken: string) {
    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ qrToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResult({ ok: false, error: data.error ?? "Check-in failed" });
      return;
    }
    setResult(data);
  }

  async function manualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await submitToken(manualCode.trim());
    setManualCode("");
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink-900 inline-flex items-center gap-2">
            <Camera className="h-4 w-4" /> Camera scanner
          </h2>
          {scanning ? (
            <button onClick={stopScanner} className="btn-ghost px-3 py-1 text-xs">
              Stop
            </button>
          ) : (
            <button onClick={startScanner} className="btn-primary px-3 py-1.5 text-xs">
              Start camera
            </button>
          )}
        </div>
        <div
          id={containerId}
          className="w-full aspect-square rounded-lg bg-ink-900 overflow-hidden flex items-center justify-center text-white text-sm"
        >
          {!scanning ? "Press 'Start camera' to begin scanning" : null}
        </div>

        <form onSubmit={manualSubmit} className="mt-4 flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Or paste a code here"
            className="input flex-1"
          />
          <button type="submit" className="btn-secondary">
            <Type className="h-4 w-4" /> Submit
          </button>
        </form>
      </div>

      <div className="card p-5 min-h-[300px] flex flex-col">
        <h2 className="font-semibold text-ink-900 mb-3">Last scan</h2>
        {!result ? (
          <div className="flex-1 flex items-center justify-center text-sm text-ink-500 text-center px-6">
            Scan an attendee's QR code or paste a code to check them in.
          </div>
        ) : result.ok ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div
              className={`h-16 w-16 rounded-full flex items-center justify-center ${
                result.alreadyCheckedIn ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <CheckCircle className="h-9 w-9" />
            </div>
            <div className="mt-3 text-lg font-semibold text-ink-900">{result.attendee?.name}</div>
            <div className="text-sm text-ink-500">{result.attendee?.email}</div>
            {result.attendee?.faculty ? (
              <div className="text-xs text-ink-400 mt-1">{result.attendee.faculty}</div>
            ) : null}
            <div
              className={`mt-4 ${result.alreadyCheckedIn ? "badge-accent" : "badge-green"}`}
            >
              {result.alreadyCheckedIn ? "Already checked in" : "Checked in just now"}
            </div>
            {result.checkedInAt ? (
              <div className="text-xs text-ink-400 mt-2">
                {new Date(result.checkedInAt).toLocaleString()}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
              <AlertCircle className="h-9 w-9" />
            </div>
            <div className="mt-3 text-lg font-semibold text-ink-900">Could not check in</div>
            <div className="text-sm text-ink-500 mt-1">{result.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
