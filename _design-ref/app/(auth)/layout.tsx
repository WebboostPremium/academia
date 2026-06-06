import Link from 'next/link'
import Image from 'next/image'
import { Logo } from '@/components/shared/logo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <Link href="/" aria-label="Inicio">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="/images/hero-catequesis.png"
          alt="Vitral de capilla con luz cálida"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-primary/40" />
        <div className="absolute bottom-10 left-10 right-10 text-primary-foreground">
          <p className="font-serif text-2xl font-medium leading-snug text-balance">
            {'"'}Dejad que los niños se acerquen a mí{'"'}
          </p>
          <p className="mt-2 text-sm text-primary-foreground/80">Mateo 19:14</p>
        </div>
      </div>
    </div>
  )
}
