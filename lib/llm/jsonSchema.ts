import { PROVINCIES, SECTOREN, PERIODE_TYPES } from "../schema";

const num = { type: ["number", "null"] } as const;
const str = { type: ["string", "null"] } as const;
const bool = { type: ["boolean", "null"] } as const;

/** JSON Schema van ExtractionSchema voor tool-use / structured output. */
export const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["authenticity", "fields"],
  properties: {
    authenticity: {
      type: "object",
      additionalProperties: false,
      required: ["is_payslip", "visible_bsn_or_iban", "confidence", "signals"],
      properties: {
        is_payslip: { type: "boolean" },
        visible_bsn_or_iban: { type: "boolean" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        signals: { type: "array", items: { type: "string" }, maxItems: 10 },
      },
    },
    fields: {
      type: "object",
      additionalProperties: false,
      required: [
        "functie", "sector", "provincie", "leeftijd", "dienstjaren", "periode", "periode_type",
        "uren_per_week", "basissalaris_periode", "bruto_totaal_periode", "totaal_inhoudingen_periode",
        "netto_periode", "loonheffing_periode", "pensioen_werknemer_periode", "vakantiegeld_pct",
        "dertiende_maand", "cao", "schaal", "lease_auto",
      ],
      properties: {
        functie: str,
        sector: { type: ["string", "null"], enum: [...SECTOREN, null] },
        provincie: { type: ["string", "null"], enum: [...PROVINCIES, null] },
        leeftijd: { type: ["integer", "null"] },
        dienstjaren: num,
        periode: { type: ["string", "null"], description: "YYYY-MM" },
        periode_type: { type: ["string", "null"], enum: [...PERIODE_TYPES, null] },
        uren_per_week: num,
        basissalaris_periode: num,
        bruto_totaal_periode: num,
        totaal_inhoudingen_periode: num,
        netto_periode: num,
        loonheffing_periode: num,
        pensioen_werknemer_periode: num,
        vakantiegeld_pct: num,
        dertiende_maand: bool,
        cao: str,
        schaal: str,
        lease_auto: bool,
      },
    },
  },
} as const;
