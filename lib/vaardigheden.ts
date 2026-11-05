/**
 * Voorgedefinieerde lijst vaardigheden/kwalificaties waaruit de gebruiker
 * er maximaal drie kiest. Bewust een gesloten lijst: vrije tekst kan PII bevatten
 * en is niet te aggregeren. Nieuwe items alleen toevoegen, niet hernoemen
 * (opgeslagen waarden in de database moeten geldig blijven).
 */
export const VAARDIGHEDEN_GROEPEN = {
  "Persoonlijk": [
    "Analytisch", "Sociaal", "Communicatief", "Leidinggeven", "Coachen", "Klantgericht",
    "Commercieel", "Onderhandelen", "Creatief", "Probleemoplossend", "Organiseren / plannen",
    "Zelfstandig", "Samenwerken", "Presenteren", "Stressbestendig", "Nauwkeurig",
    "Strategisch denken", "Ondernemend", "Empathisch", "Overtuigingskracht",
  ],
  "Programmeren & IT": [
    "Python", "Java", "C#", "C++", "C", "JavaScript", "TypeScript", "Go", "Rust", "PHP",
    "Ruby", "Kotlin", "Swift", "R", "SQL", "Scala", "React", "Angular", ".NET", "Node.js",
    "SAP", "Salesforce", "Power BI", "Tableau", "Excel (gevorderd)", "VBA",
    "AWS", "Azure", "Google Cloud", "Kubernetes", "Docker", "DevOps / CI/CD", "Linux",
    "Netwerkbeheer", "Informatiebeveiliging", "Machine learning / AI", "Data engineering",
    "UX/UI-design", "Testen / QA", "Scrum / Agile",
  ],
  "Financieel & juridisch": [
    "CFA", "RA", "AA", "RC", "ACCA", "FRM", "CPA", "Boekhouden", "Controlling",
    "Fiscaal recht", "Belastingadvies", "Risicomanagement", "Compliance", "Audit",
    "Treasury", "Actuarieel", "Financiële modellering", "IFRS", "Juridisch advies",
    "Contractenrecht", "Arbeidsrecht", "Privacy / AVG",
  ],
  "Financiële dienstverlening (Wft)": [
    "Wft Basis", "Wft Schade", "Wft Vermogen", "Wft Hypothecaire krediet", "Wft Pensioen",
    "Wft Consumptief krediet", "Wft Zorgverzekeringen", "Wft Inkomen", "Hypotheekadvies",
    "Beleggingsadvies", "Kredietanalyse", "KYC / AML",
  ],
  "Management & bedrijfsvoering": [
    "Projectmanagement", "Prince2", "PMP", "IPMA", "Lean / Six Sigma", "ITIL",
    "Procesverbetering", "Change management", "Productmanagement", "Inkoop",
    "Supply chain", "Accountmanagement", "Marketing", "Online marketing / SEO",
    "Content / copywriting", "HR / recruitment", "Beleidsadvies", "Kwaliteitsmanagement (ISO)",
  ],
  "Zorg & onderwijs": [
    "BIG-registratie", "Verpleegkunde", "Medische kennis", "Farmacie", "Psychologie",
    "Fysiotherapie", "Begeleiden", "Lesgeven / didactiek", "Lesbevoegdheid",
    "Jeugdzorg", "EHBO / BHV",
  ],
  "Techniek & vakmanschap": [
    "Werktuigbouwkunde", "Elektrotechniek", "Installatietechniek", "Bouwkunde", "CAD / BIM",
    "PLC-programmeren", "Lassen", "Onderhoud / monteur", "VCA", "NEN 3140",
    "Rijbewijs C/CE", "Heftruckcertificaat", "Logistiek / planning", "Laboratorium", "Chemie",
  ],
  "Talen": [
    "Engels", "Duits", "Frans", "Spaans", "Chinees", "Arabisch", "Turks", "Pools",
    "Nederlands als tweede taal",
  ],
} as const;

export const VAARDIGHEDEN = Object.values(VAARDIGHEDEN_GROEPEN).flat() as unknown as readonly [string, ...string[]];

export const MAX_VAARDIGHEDEN = 3;
