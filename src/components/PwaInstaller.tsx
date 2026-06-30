"use client";
import { useEffect, useState } from "react";
import { Download, Bell, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Mounts the service worker and exposes:
 *   - An "Install app" bar when the browser fires beforeinstallprompt
 *   - A "Turn on notifications" button if pushManager is available
 *
 * Lives in the (hub) layout so it's only shown to attendees inside an event
 * — the marketing landing doesn't need a service worker.
 */
export function PwaInstaller({ vapidPublicKey }: { vapidPublicKey?: string | null }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissedInstall, setDismissedInstall] = useState(false);
  const [pushStatus, setPushStatus] = useState<
    "unknown" | "subscribed" | "denied" | "default" | "unsupported"
  >("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const beforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installedHandler);

    // Read previous dismiss decision.
    if (window.sessionStorage.getItem("uon_pwa_install_dismissed") === "1") {
      setDismissedInstall(true);
    }

    // Initial push status.
    (async () => {
      if (!("Notification" in window)) {
        setPushStatus("unsupported");
        return;
      }
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        setPushStatus("subscribed");
        return;
      }
      setPushStatus(Notification.permission as any);
    })();

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  function dismissInstall() {
    setDismissedInstall(true);
    try {
      window.sessionStorage.setItem("uon_pwa_install_dismissed", "1");
    } catch {}
  }

  async function subscribePush() {
    if (!vapidPublicKey) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setPushStatus(perm as any);
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const json = sub.toJSON();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });
    setPushStatus("subscribed");
  }

  const showInstall = !installed && !dismissedInstall && installPrompt;
  const showPushPrompt =
    vapidPublicKey && pushStatus === "default" && !showInstall;
  if (!showInstall && !showPushPrompt) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 sm:left-auto sm:right-4 sm:bottom-6 sm:w-80">
      <div className="rounded-2xl bg-ink-900 text-white shadow-pop p-4 flex items-start gap-3">
        <div className="shrink-0 h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
          {showInstall ? (
            <Download className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {showInstall ? (
            <>
              <div className="text-sm font-semibold">Install the event app</div>
              <div className="text-xs text-white/70 mt-0.5">
                Add to your home screen for offline schedule access.
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={install}
                  className="rounded-full bg-accent text-ink-900 px-3 py-1.5 text-xs font-semibold hover:bg-accent-dark hover:text-white transition"
                >
                  Install
                </button>
                <button
                  onClick={dismissInstall}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition"
                >
                  Not now
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold">Get session reminders</div>
              <div className="text-xs text-white/70 mt-0.5">
                Push notifications for upcoming sessions, broadcasts and Q&amp;A
                replies.
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={subscribePush}
                  className="rounded-full bg-accent text-ink-900 px-3 py-1.5 text-xs font-semibold hover:bg-accent-dark hover:text-white transition"
                >
                  Turn on
                </button>
                <button
                  onClick={() => setPushStatus("denied")}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition"
                >
                  Not now
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={showInstall ? dismissInstall : () => setPushStatus("denied")}
          className="shrink-0 text-white/60 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
