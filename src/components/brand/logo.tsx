import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/logo-catequesis-online.jpg";

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
}: LogoProps) {
  const sizes = { sm: 48, md: 60, lg: 80 };

  const content = (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={LOGO_SRC}
        alt="Catequesis Online — Ministerio de Catequesis, Catedral San Miguel"
        width={sizes[size]}
        height={sizes[size]}
        className="h-auto w-auto object-contain"
        style={{ maxHeight: sizes[size], width: "auto" }}
        priority
      />
    </span>
  );

  if (href) return <Link href={href} aria-label="Inicio Catequesis Online">{content}</Link>;
  return content;
}
