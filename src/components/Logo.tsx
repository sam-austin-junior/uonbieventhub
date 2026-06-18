import { cn } from "@/lib/utils";

export function Logo({
  size = 40,
  className,
  rounded = true,
  bg = "white",
}: {
  size?: number;
  className?: string;
  rounded?: boolean;
  bg?: "white" | "transparent" | "brand";
}) {
  const bgClass =
    bg === "brand" ? "bg-brand-700" : bg === "white" ? "bg-white" : "bg-transparent";
  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center overflow-hidden ring-1 ring-ink-100",
        rounded ? "rounded-md" : "",
        bgClass,
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src="/uon-logo.png"
        alt="University of Nairobi"
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

