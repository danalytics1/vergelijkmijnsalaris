/**
 * PII-detectie die zowel in de browser (op OCR-tekst) als op de server
 * (op LLM-output) draait. Bewust streng: liever een valse melding dan een
 * gelekt BSN.
 */

/** 11-proef voor BSN (9 cijfers, of 8 met voorloopnul). */
export function isValidBsn(raw: string): boolean {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 8) digits = "0" + digits;
  if (digits.length !== 9) return false;
  if (/^0+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += Number(digits[i]) * (9 - i);
  sum -= Number(digits[8]);
  return sum % 11 === 0;
}

/** ISO 13616 mod-97 check. */
export function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch >= "A" && ch <= "Z" ? (ch.charCodeAt(0) - 55).toString() : ch;
    for (const d of code) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

export type PiiHit = { type: "bsn" | "iban" | "email" | "postcode" | "telefoon"; match: string; index: number };

// OCR leest O/0, I/1, S/5 en B/8 regelmatig door elkaar.
function ocrDigits(s: string) {
  return s.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").replace(/S/g, "5").replace(/B/g, "8");
}

/**
 * Zoekt BSN- en IBAN-achtige reeksen. `strict` = alleen gevalideerde matches
 * (11-proef / mod-97); niet-strict meldt ook NL-IBAN-patronen die door OCR-
 * ruis de checksum niet halen.
 */
export function findBsnIban(text: string, { strict = false } = {}): PiiHit[] {
  const hits: PiiHit[] = [];

  // BSN: 9 cijfers, eventueel met spaties of punten (123 456 789 / 1234.56.789)
  const bsnRe = /(?<![\dA-Za-z])([\dOoIl|SB]{2,4}[ .\-]?[\dOoIl|SB]{2,4}[ .\-]?[\dOoIl|SB]{1,4})(?![\dA-Za-z])/g;
  for (const m of text.matchAll(bsnRe)) {
    const candidate = ocrDigits(m[1]).replace(/[ .\-]/g, "");
    if (/^\d{9}$/.test(candidate) && isValidBsn(candidate)) {
      // Bedragen als "123.456.789" zijn op een strook vrijwel uitgesloten; tel mee.
      hits.push({ type: "bsn", match: m[1], index: m.index ?? 0 });
    }
  }

  // IBAN (alle landen), met optionele spaties per 4 tekens
  const ibanRe = /\b([A-Z]{2}\s?\d{2}(?:\s?[A-Z0-9]{4}){2,7}(?:\s?[A-Z0-9]{1,3})?)\b/gi;
  for (const m of text.matchAll(ibanRe)) {
    const compact = m[1].replace(/\s+/g, "").toUpperCase();
    const fixed = compact.slice(0, 2) + ocrDigits(compact.slice(2, 4)) + compact.slice(4, 8) + ocrDigits(compact.slice(8));
    const nlPattern = /^NL\d{2}[A-Z]{4}\d{10}$/.test(fixed);
    if (isValidIban(fixed) || (!strict && nlPattern)) {
      hits.push({ type: "iban", match: m[1], index: m.index ?? 0 });
    }
  }

  if (!strict) {
    // Label-gebaseerd: een nummer direct na "BSN"/"sofinummer" of "IBAN"/"rekening"
    // telt altijd, ook als OCR een cijfer mist en de checksum daardoor faalt.
    const bsnLabel = /\b(?:bsn|b\.s\.n\.?|sofi(?:nummer|nr)?|burgerservice(?:nummer|nr)?)\b[\s:.#nr]*([\dOoIl|SB][\dOoIl|SB .\-]{5,14}[\dOoIl|SB])/gi;
    for (const m of text.matchAll(bsnLabel)) {
      const digits = ocrDigits(m[1]).replace(/[^\d]/g, "");
      if (digits.length >= 7 && digits.length <= 10 && !hits.some((h) => h.type === "bsn" && h.index >= (m.index ?? 0))) {
        hits.push({ type: "bsn", match: m[1], index: m.index ?? 0 });
      }
    }
    const ibanLabel = /\b(?:iban|rekening(?:nummer|nr)?|bankrekening|rek\.?\s?nr\.?)\b[^\n\dA-Z]{0,30}([A-Z]{2}[\s\dA-Z]{10,32})/gi;
    for (const m of text.matchAll(ibanLabel)) {
      const compact = m[1].replace(/\s+/g, "");
      if (/^[A-Z]{2}\d{2}/i.test(compact) && compact.length >= 12 && !hits.some((h) => h.type === "iban")) {
        hits.push({ type: "iban", match: m[1].trim(), index: m.index ?? 0 });
      }
    }
  }

  return hits;
}

/** Alle PII-patronen; gebruikt als vangnet op de LLM-output. */
export function findAnyPii(text: string): PiiHit[] {
  const hits = findBsnIban(text, { strict: false });
  for (const m of text.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)) hits.push({ type: "email", match: m[0], index: m.index ?? 0 });
  for (const m of text.matchAll(/\b[1-9]\d{3}\s?(?!SA|SD|SS)[A-Z]{2}\b/g)) hits.push({ type: "postcode", match: m[0], index: m.index ?? 0 });
  for (const m of text.matchAll(/(?:\+31|0031|\b0)[\s-]?\d(?:[\s-]?\d){8}\b/g)) hits.push({ type: "telefoon", match: m[0], index: m.index ?? 0 });
  return hits;
}
