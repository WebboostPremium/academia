import type { CourseSlug } from "@/types/course";

export const BENEFITS = [
  { title: "A tu ritmo", desc: "Estudia cuando y donde quieras, 24/7 desde cualquier dispositivo." },
  { title: "Acompañamiento", desc: "Catequistas dedicados que responden tus dudas y guían tu proceso." },
  { title: "Contenido multimedia", desc: "Videos, PDFs, quizzes y tareas para una formación completa." },
  { title: "Certificado oficial", desc: "Al completar el programa recibes tu certificado de preparación." },
  { title: "Clases en vivo", desc: "Sesiones por Zoom o Google Meet para profundizar en la fe." },
  { title: "Pago seguro", desc: "Transacciones protegidas con Wompi El Salvador." },
];

export const TESTIMONIALS = [
  { name: "María Elena R.", course: "Primera Comunión", text: "Mi hija se preparó con alegría. Los videos y las oraciones la ayudaron muchísimo." },
  { name: "Carlos Antonio M.", course: "Confirmación", text: "Excelente plataforma. El catequista siempre respondió mis preguntas en el foro." },
  { name: "Ana Lucía V.", course: "Bautismo", text: "Preparamos a nuestro bebé desde casa. Muy práctico y con contenido de calidad." },
];

export const FAQ_ITEMS = [
  { q: "¿Necesito conocimientos previos?", a: "No. Los programas están diseñados para familias y personas que inician o retoman su camino de fe." },
  { q: "¿Cuánto tiempo tengo para completar el curso?", a: "Tienes acceso ilimitado mientras tu inscripción esté activa. Puedes avanzar a tu propio ritmo." },
  { q: "¿Cómo funciona el pago?", a: "Realizas un pago único por programa a través de Wompi. Al confirmarse, se desbloquea el curso automáticamente." },
  { q: "¿Recibo certificado al terminar?", a: "Sí. Al aprobar las evaluaciones y completar los requisitos, puedes descargar tu certificado en PDF." },
  { q: "¿Puedo contactar a un catequista?", a: "Sí. Tienes foro, clases en vivo y canales de contacto institucional para recibir acompañamiento." },
];

export const PROMO_VIDEO_ID = "dQw4w9WgXcQ";

export const HERO_IMAGE = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&h=500&fit=crop";

/** Conteos por defecto (como en el mockup) cuando aún no hay módulos en Firestore */
export const DEFAULT_PROGRAM_STATS: Record<CourseSlug, { modules: number; lessons: number; price: number }> = {
  bautismo: { modules: 12, lessons: 20, price: 2500 },
  "primera-comunion": { modules: 15, lessons: 25, price: 3500 },
  confirmacion: { modules: 18, lessons: 30, price: 4000 },
};

export const DEFAULT_COURSE_META: Record<CourseSlug, {
  image: string;
  objectives: string[];
  duration: string;
  durationWeeks: number;
  instructorBio: string;
}> = {
  bautismo: {
    image: "https://images.unsplash.com/photo-1507692049790-aeea99e00404?w=900&h=500&fit=crop&q=80",
    duration: "4 semanas",
    durationWeeks: 4,
    objectives: [
      "Comprender el significado del Bautismo como sacramento de inicio cristiano",
      "Conocer los derechos y deberes de padres y padrinos",
      "Preparar la celebración litúrgica del Bautismo",
      "Familiarizarse con oraciones y símbolos básicos de la fe",
    ],
    instructorBio: "Sacerdote y catequista con experiencia en preparación sacramental familiar.",
  },
  "primera-comunion": {
    image: "https://images.unsplash.com/photo-1519494026892-80bbd9d6ecb6?w=900&h=500&fit=crop&q=80",
    duration: "8 semanas",
    durationWeeks: 8,
    objectives: [
      "Prepararse para recibir a Jesús en la Eucaristía",
      "Aprender oraciones fundamentales de la Iglesia",
      "Comprender el significado de la Primera Comunión",
      "Vivir los mandamientos y el amor al prójimo",
    ],
    instructorBio: "Catequista certificada especializada en formación eucarística infantil y juvenil.",
  },
  confirmacion: {
    image: "https://images.unsplash.com/photo-1548625144-eacae468d7ca?w=900&h=500&fit=crop&q=80",
    duration: "10 semanas",
    durationWeeks: 10,
    objectives: [
      "Profundizar en los dones del Espíritu Santo",
      "Fortalecer el compromiso con la Iglesia y la comunidad",
      "Conocer la doctrina social y moral católica",
      "Prepararse para el sacramento de la Confirmación",
    ],
    instructorBio: "Presbítero con trayectoria en acompañamiento juvenil y adultos en camino de fe.",
  },
};
