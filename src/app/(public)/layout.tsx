import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      {children}
      <PublicFooter />
      <WhatsAppButton />
    </div>
  );
}
