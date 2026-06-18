import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={cn("rounded-full object-cover ring-1 ring-ink-100", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full bg-brand-700 text-white flex items-center justify-center font-semibold ring-1 ring-brand-800",
        className
      )}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials(name)}
    </div>
  );
}
