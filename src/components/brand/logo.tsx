import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/logo-catequi-online.png";

interface LogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({
  size = "md",
  href = "/",
  className,
  showText = true,
}: LogoProps) {
  const heights = { sm: 44, md: 56, lg: 72 };
  const widths = { sm: 120, md: 150, lg: 190 };

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={LOGO_SRC}
        alt="catequi online — formación católica"
        width={showText ? widths[size] : heights[size]}
        height={heights[size]}
        className="h-auto w-auto object-contain"
        style={{ maxHeight: heights[size], width: "auto" }}
        priority
      />
    </span>
  );

  if (href) return <Link href={href} aria-label="Inicio catequi online">{content}</Link>;
  return content;
}
