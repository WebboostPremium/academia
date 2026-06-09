import {
  LayoutDashboard, BookOpen, Layers, PlayCircle, ClipboardList, Users, UserCog,
  CreditCard, Award, FileText, Calendar, Heart, Church, MessageSquare, Bell, Settings, ClipboardCheck,
  Ticket, ScrollText, CalendarDays, Images, Newspaper,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Cursos", href: "/admin/cursos", icon: <BookOpen className="h-4 w-4" /> },
  { title: "Módulos", href: "/admin/modulos", icon: <Layers className="h-4 w-4" /> },
  { title: "Lecciones", href: "/admin/lecciones", icon: <PlayCircle className="h-4 w-4" /> },
  { title: "Quizzes", href: "/admin/quizzes", icon: <ClipboardList className="h-4 w-4" /> },
  { title: "Estudiantes", href: "/admin/estudiantes", icon: <Users className="h-4 w-4" /> },
  { title: "Catequistas", href: "/admin/catequistas", icon: <UserCog className="h-4 w-4" /> },
  { title: "Asistencia", href: "/admin/asistencia", icon: <ClipboardCheck className="h-4 w-4" /> },
  { title: "Pagos", href: "/admin/pagos", icon: <CreditCard className="h-4 w-4" /> },
  { title: "Cupones", href: "/admin/cupones", icon: <Ticket className="h-4 w-4" /> },
  { title: "Calendario", href: "/admin/calendario", icon: <CalendarDays className="h-4 w-4" /> },
  { title: "Certificados", href: "/admin/certificados", icon: <Award className="h-4 w-4" /> },
  { title: "Tareas", href: "/admin/tareas", icon: <FileText className="h-4 w-4" /> },
  { title: "Clases en Vivo", href: "/admin/clases", icon: <Calendar className="h-4 w-4" /> },
  { title: "Oraciones", href: "/admin/oraciones", icon: <Heart className="h-4 w-4" /> },
  { title: "Gestión Sacramental", href: "/admin/sacramental", icon: <Church className="h-4 w-4" /> },
  { title: "Foro", href: "/admin/foro", icon: <MessageSquare className="h-4 w-4" /> },
  { title: "Galería", href: "/admin/galeria", icon: <Images className="h-4 w-4" /> },
  { title: "Noticias", href: "/admin/noticias", icon: <Newspaper className="h-4 w-4" /> },
  { title: "Notificaciones", href: "/admin/notificaciones", icon: <Bell className="h-4 w-4" /> },
  { title: "Actividad", href: "/admin/actividad", icon: <ScrollText className="h-4 w-4" /> },
  { title: "Configuración", href: "/admin/configuracion", icon: <Settings className="h-4 w-4" /> },
];
