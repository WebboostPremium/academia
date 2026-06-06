import {
  LayoutDashboard, Users, ClipboardCheck, FileText, Calendar,
  MessageSquare, Church, User, Settings,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

export const catequistaNavItems: NavItem[] = [
  { title: "Dashboard", href: "/catequista", icon: <LayoutDashboard className="h-4 w-4" /> },
  { title: "Estudiantes", href: "/catequista/estudiantes", icon: <Users className="h-4 w-4" /> },
  { title: "Asistencia", href: "/catequista/asistencia", icon: <ClipboardCheck className="h-4 w-4" /> },
  { title: "Tareas", href: "/catequista/tareas", icon: <FileText className="h-4 w-4" /> },
  { title: "Clases en Vivo", href: "/catequista/clases", icon: <Calendar className="h-4 w-4" /> },
  { title: "Foro", href: "/catequista/foro", icon: <MessageSquare className="h-4 w-4" /> },
  { title: "Gestión Sacramental", href: "/catequista/sacramental", icon: <Church className="h-4 w-4" /> },
  { title: "Mi Perfil", href: "/catequista/perfil", icon: <User className="h-4 w-4" /> },
  { title: "Configuración", href: "/catequista/configuracion", icon: <Settings className="h-4 w-4" /> },
];
