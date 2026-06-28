import Image from "next/image";
import { cn } from "@/lib/utils";

export function Lockup({
  width = 320,
  className,
  priority = false,
}: {
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/uon-lockup.png"
      alt="Unity of Nations Event Hub — Plan. Manage. Connect. Succeed."
      width={width}
      height={width}
      priority={priority}
      className={cn("h-auto w-auto", className)}
      style={{ width, height: "auto" }}
    />
  );
}
