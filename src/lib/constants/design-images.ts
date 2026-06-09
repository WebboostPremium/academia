import { DEFAULT_COURSE_META } from "@/lib/constants/public-content";

/** Imágenes católicas — vitrales, capillas, sacramentos (Unsplash) */
export const DESIGN_IMAGES = {
  /** Vitral de iglesia — hero principal */
  hero: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1400&h=900&fit=crop&q=80",
  /** Interior de capilla con luz — login / registro */
  login: "https://images.unsplash.com/photo-1548625144-eacae468d7ca?w=1200&h=1600&fit=crop&q=80",
  /** Rosario y cruz sobre Biblia */
  faith: "https://images.unsplash.com/photo-1507692049790-aeea99e00404?w=1200&h=800&fit=crop&q=80",
  /** Catedral — sección misión */
  mission: "https://images.unsplash.com/photo-1438232992991-995b9458d3c0?w=1200&h=800&fit=crop&q=80",
  /** Velas en altar — eucaristía */
  eucharist: "https://images.unsplash.com/photo-1519494026892-80bbd9d6ecb6?w=1200&h=800&fit=crop&q=80",
  bautismo: DEFAULT_COURSE_META.bautismo.image,
  primeraComunion: DEFAULT_COURSE_META["primera-comunion"].image,
  confirmacion: DEFAULT_COURSE_META.confirmacion.image,
};
