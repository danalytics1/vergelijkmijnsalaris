import type { PageImage } from "./llm/types";

export const MAX_PAGES = 3;
export const MAX_BYTES = 5 * 1024 * 1024; // per pagina, na client-side verkleinen

/** Controleert magic bytes; vertrouwt niet op de opgegeven MIME-type. */
export function sniffImage(buf: Buffer): PageImage["mime"] | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}
