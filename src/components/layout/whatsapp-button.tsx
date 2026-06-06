"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/services/settings";

function toWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function WhatsAppButton() {
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      if (s?.institution?.whatsapp) setWhatsapp(s.institution.whatsapp);
    });
  }, []);

  if (!whatsapp) return null;

  return (
    <Link
      href={toWhatsAppUrl(whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </Link>
  );
}
