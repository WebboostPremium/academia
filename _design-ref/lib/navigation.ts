import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Video,
  DollarSign,
  Settings,
  GraduationCap,
  ClipboardCheck,
  CalendarCheck,
  FileText,
  HeartHandshake,
  MessageCircleQuestion,
  Award,
  ShoppingBag,
} from 'lucide-react'
import type { Role } from '@/types'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const adminNav: NavItem[] = [
  { label: 'Resumen', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Cursos', href: '/admin/cursos', icon: BookOpen },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { label: 'Clases en vivo', href: '/admin/clases', icon: Video },
  { label: 'Finanzas', href: '/admin/finanzas', icon: DollarSign },
  { label: 'Configuración', href: '/admin/configuracion', icon: Settings },
]

const catequistaNav: NavItem[] = [
  { label: 'Resumen', href: '/catequista/dashboard', icon: LayoutDashboard },
  { label: 'Estudiantes', href: '/catequista/estudiantes', icon: GraduationCap },
  { label: 'Tareas', href: '/catequista/tareas', icon: ClipboardCheck },
  { label: 'Asistencia', href: '/catequista/asistencia', icon: CalendarCheck },
  {
    label: 'Expedientes',
    href: '/catequista/expedientes',
    icon: FileText,
  },
]

const estudianteNav: NavItem[] = [
  { label: 'Inicio', href: '/estudiante/dashboard', icon: LayoutDashboard },
  { label: 'Catálogo', href: '/estudiante/catalogo', icon: ShoppingBag },
  { label: 'Mis cursos', href: '/estudiante/cursos', icon: BookOpen },
  { label: 'Mis oraciones', href: '/estudiante/oraciones', icon: HeartHandshake },
  { label: 'Foro', href: '/estudiante/foro', icon: MessageCircleQuestion },
  { label: 'Certificados', href: '/estudiante/certificados', icon: Award },
]

export function navForRole(role: Role): NavItem[] {
  switch (role) {
    case 'admin':
      return adminNav
    case 'catequista':
      return catequistaNav
    default:
      return estudianteNav
  }
}

export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  catequista: 'Catequista',
  estudiante: 'Estudiante',
}
