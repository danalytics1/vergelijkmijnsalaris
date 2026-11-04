import { z } from "zod";

export const PROVINCIES = [
  "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg",
  "Noord-Brabant", "Noord-Holland", "Overijssel", "Utrecht", "Zeeland", "Zuid-Holland",
] as const;

export const SECTOREN = [
  "ICT", "Financiële dienstverlening", "Zorg en welzijn", "Onderwijs", "Overheid",
  "Industrie", "Bouw", "Handel", "Transport en logistiek", "Horeca",
  "Zakelijke dienstverlening", "Energie", "Landbouw", "Cultuur en recreatie", "Overig",
] as const;

export const OPLEIDINGSNIVEAUS = ["vmbo/mbo1", "mbo", "hbo", "wo", "onbekend"] as const;

export const PERIODE_TYPES = ["maand", "4weken", "week"] as const;

/**
 * Wat de LLM mag teruggeven. Bevat bewust GEEN naam, adres, BSN, IBAN,
 * personeelsnummer, geboortedatum of werkgeversnaam.
 */
export const ExtractionSchema = z.object({
  authenticity: z.object({
    is_payslip: z.boolean(),
    visible_bsn_or_iban: z.boolean(),
    confidence: z.number().min(0).max(1),
    signals: z.array(z.string().max(200)).max(10),
  }),
  fields: z.object({
    functie: z.string().max(100).nullable(),
    sector: z.enum(SECTOREN).nullable(),
    provincie: z.enum(PROVINCIES).nullable(),
    leeftijd: z.number().int().min(15).max(80).nullable(),
    dienstjaren: z.number().min(0).max(60).nullable(),
    periode: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable(),
    periode_type: z.enum(PERIODE_TYPES).nullable(),
    uren_per_week: z.number().min(1).max(60).nullable(),
    basissalaris_periode: z.number().min(0).max(100000).nullable(),
    bruto_totaal_periode: z.number().min(0).max(200000).nullable(),
    totaal_inhoudingen_periode: z.number().min(0).max(200000).nullable(),
    netto_periode: z.number().min(-10000).max(200000).nullable(),
    loonheffing_periode: z.number().min(0).max(100000).nullable(),
    pensioen_werknemer_periode: z.number().min(0).max(20000).nullable(),
    vakantiegeld_pct: z.number().min(0).max(25).nullable(),
    dertiende_maand: z.boolean().nullable(),
    cao: z.string().max(100).nullable(),
    schaal: z.string().max(20).nullable(),
    lease_auto: z.boolean().nullable(),
  }),
});
export type Extraction = z.infer<typeof ExtractionSchema>;
export type ExtractedFields = Extraction["fields"];

/** Wat de gebruiker indient na controle van het formulier. */
export const SubmissionSchema = z.object({
  functie: z.string().min(2).max(100),
  sector: z.enum(SECTOREN),
  provincie: z.enum(PROVINCIES),
  leeftijd: z.number().int().min(15).max(80),
  dienstjaren: z.number().min(0).max(60),
  opleidingsniveau: z.enum(OPLEIDINGSNIVEAUS),
  uren_per_week: z.number().min(1).max(60),
  bruto_maand: z.number().min(500).max(100000),
  vakantiegeld_pct: z.number().min(0).max(25),
  dertiende_maand: z.boolean(),
  thuiswerkdagen: z.number().min(0).max(5).multipleOf(0.5),
  pensioen_pct: z.number().min(0).max(30).nullable(),
  lease_auto: z.boolean(),
  cao: z.string().max(100).nullable(),
  periode: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
});
export type Submission = z.infer<typeof SubmissionSchema>;
