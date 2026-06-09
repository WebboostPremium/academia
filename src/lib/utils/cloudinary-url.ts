/** Fuerza descarga directa de PDF en Cloudinary */
export function cloudinaryDownloadUrl(url: string, filename?: string): string {
  if (!url.includes("res.cloudinary.com")) return url;
  const withAttachment = url.includes("/upload/fl_attachment")
    ? url
    : url.replace("/upload/", "/upload/fl_attachment/");
  if (filename) {
    const encoded = encodeURIComponent(filename);
    return withAttachment.replace(/\/([^/]+)\.pdf/i, `/${encoded}.pdf`);
  }
  return withAttachment;
}
