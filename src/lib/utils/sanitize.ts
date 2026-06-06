import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li"] });
}

export function sanitizeText(text: string): string {
  return text.trim().replace(/[<>]/g, "");
}
