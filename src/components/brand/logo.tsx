import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({
  variant = "dark",
  size = "md",
  href = "/",
  className,
  textClassName,
  showText = true,
}: LogoProps) {
  const iconSizes = { sm: "size-7", md: "size-9", lg: "size-10" };
  const textSizes = { sm: "text-base", md: "text-lg", lg: "text-xl" };

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-primary-foreground",
          iconSizes[size],
          variant === "light" ? "bg-white/15 text-white" : "bg-primary"
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18" />
          <path d="M6 8h12" />
          <path d="M12 21c4-2 6-5 6-9V6l-6-3-6 3v6c0 4 2 7 6 9Z" />
        </svg>
      </span>
      {showText && (
        <span
          className={cn(
            "font-serif font-semibold leading-tight tracking-tight",
            textSizes[size],
            variant === "light" ? "text-white" : "text-foreground",
            textClassName
          )}
        >
          Catequesis
          <span className="text-accent">Online</span>
        </span>
      )}
    </span>
  );

  if (href) return <Link href={href} aria-label="Inicio">{content}</Link>;
  return content;
}
