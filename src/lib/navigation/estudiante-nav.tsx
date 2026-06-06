import {
  Home, BookOpen, PlayCircle, ClipboardList, FileText, TrendingUp,
  Heart, Award, ShoppingBag, Calendar, MessageSquare, User,
} from "lucide-react";
import type { NavItem } from "@/components/layout/sidebar";

export const estudianteNavItems: NavItem[] = [
  { title: "Inicio", href: "/estudiante", icon: <Home className="h-4 w-4" /> },
  { title: "Mis Cursos", href: "/estudiante/cursos", icon: <BookOpen className="h-4 w-4" /> },
  { title: "Lecciones", href: "/estudiante/lecciones", icon: <PlayCircle className="h-4 w-4" /> },
  { title: "Evaluaciones", href: "/estudiante/evaluaciones", icon: <ClipboardList className="h-4 w-4" /> },
  { title: "Tareas", href: "/estudiante/tareas", icon: <FileText className="h-4 w-4" /> },
  { title: "Mi Progreso", href: "/estudiante/progreso", icon: <TrendingUp className="h-4 w-4" /> },
  { title: "Mis Oraciones", href: "/estudiante/oraciones", icon: <Heart className="h-4 w-4" /> },
  { title: "Certificados", href: "/estudiante/certificados", icon: <Award className="h-4 w-4" /> },
  { title: "Mis Compras", href: "/estudiante/compras", icon: <ShoppingBag className="h-4 w-4" /> },
  { title: "Clases en Vivo", href: "/estudiante/clases", icon: <Calendar className="h-4 w-4" /> },
  { title: "Foro", href: "/estudiante/foro", icon: <MessageSquare className="h-4 w-4" /> },
  { title: "Mi Perfil", href: "/estudiante/perfil", icon: <User className="h-4 w-4" /> },
];
