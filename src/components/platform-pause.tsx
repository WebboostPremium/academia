import Image from "next/image";

export function PlatformPause() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <Image
          src="/brand/logo-catequesis-online.jpg"
          alt="Catequesis Online"
          width={88}
          height={88}
          className="mx-auto h-20 w-auto object-contain"
          priority
        />
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Comunicado
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground">
          Este proyecto se encuentra en pausa
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Catequesis Online no está disponible en este momento. Para reactivar el servicio
          o resolver cualquier consulta, comuníquese con{" "}
          <strong className="font-medium text-foreground">Webboost</strong>.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Quedamos atentos para asistirle cuando lo requiera.
        </p>
      </div>
    </main>
  );
}
