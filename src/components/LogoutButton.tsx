"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  variant = "sidebar",
}: {
  className?: string;
  variant?: "sidebar" | "admin" | "mobile";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const base = "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors";
  const variantClass =
    variant === "admin"
      ? "text-ink-300 hover:bg-ink-800"
      : variant === "mobile"
      ? "text-ink-600 hover:bg-ink-100"
      : "text-ink-600 hover:bg-ink-100";

  return (
    <button onClick={signOut} disabled={loading} className={cn(base, variantClass, className)}>
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
