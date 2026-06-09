import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { DESIGN_IMAGES } from "@/lib/constants/design-images";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col bg-background px-4 py-8 sm:px-8">
        <Logo size="md" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="pb-4 text-center text-xs text-muted-foreground lg:text-left">
          Plataforma de catequesis de la Iglesia Católica
        </p>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src={DESIGN_IMAGES.login}
          alt="Vitral e interior de iglesia católica"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-primary/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-10 text-primary-foreground">
          <div className="mb-6 max-w-md overflow-hidden rounded-xl border border-white/20 shadow-2xl">
            <Image
              src={DESIGN_IMAGES.faith}
              alt="Cruz y Biblia — símbolos de la fe católica"
              width={480}
              height={280}
              className="h-44 w-full object-cover"
            />
          </div>
          <p className="font-serif text-2xl font-medium leading-snug text-balance">
            &ldquo;Yo soy el camino, la verdad y la vida&rdquo;
          </p>
          <p className="mt-2 text-sm text-primary-foreground/85">Juan 14:6</p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
            Ingresa para continuar tu preparación sacramental con la guía de tu parroquia.
          </p>
        </div>
      </div>
    </div>
  );
}
