import { DEFAULT_COURSE_META } from "@/lib/constants/public-content";

const CLOUDINARY = "https://res.cloudinary.com/dxmtd2mga/image/upload/q_auto/f_auto";

/** Imágenes institucionales — Cloudinary (parroquia / sacramentos) */
export const DESIGN_IMAGES = {
  /** Hero principal — fondo de la portada */
  hero: `${CLOUDINARY}/v1781042863/406590672630251482_ortkzy.jpg`,
  /** Vitral e interior de iglesia — login / registro */
  login: `${CLOUDINARY}/v1781042863/406590672630251482_ortkzy.jpg`,
  /** Cruz y Biblia — símbolos de la fe católica */
  faith: `${CLOUDINARY}/v1781043064/27162403996581161_qiip75.webp`,
  /** Formación en la tradición de la Iglesia */
  mission: `${CLOUDINARY}/v1781042863/406590672630251482_ortkzy.jpg`,
  /** Eucaristía — Lc 22:19 */
  eucharist: `${CLOUDINARY}/v1781042863/%EF%B8%8F_Getting_ready_for_July_services__Now_s_the_z7ituj.jpg`,
  bautismo: DEFAULT_COURSE_META.bautismo.image,
  primeraComunion: DEFAULT_COURSE_META["primera-comunion"].image,
  confirmacion: DEFAULT_COURSE_META.confirmacion.image,
};
