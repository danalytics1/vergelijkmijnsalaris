import { VAARDIGHEDEN_GROEPEN } from "./vaardigheden";
import { functieKey } from "./normalize";

type Vaardigheid = (typeof VAARDIGHEDEN_GROEPEN)[keyof typeof VAARDIGHEDEN_GROEPEN][number];

/**
 * Vaste koppeling vaardigheid → functies waarin die vaardigheid goed betaalt.
 * Alleen een fallback zolang er te weinig inzendingen met vaardigheden zijn.
 * Dit is een redactionele inschatting, geen data. Per vaardigheid staan de
 * (naar verwachting) best betaalde functies vooraan.
 * Het type dwingt af dat elke vaardigheid uit lib/vaardigheden.ts erin staat.
 */
export const FUNCTIES_PER_VAARDIGHEID: Record<Vaardigheid, readonly string[]> = {
  // Persoonlijk
  "Analytisch": ["Data scientist", "Business analist", "Controller"],
  "Sociaal": ["HR-manager", "Accountmanager", "Teamleider"],
  "Communicatief": ["Communicatiemanager", "Accountmanager", "Woordvoerder"],
  "Leidinggeven": ["Directeur", "Operationeel manager", "Afdelingshoofd", "Teamleider"],
  "Coachen": ["HR-manager", "Teamleider", "Loopbaancoach"],
  "Klantgericht": ["Accountmanager", "Customer success manager", "Klantenservicemanager"],
  "Commercieel": ["Sales manager", "Accountmanager", "Business developer"],
  "Onderhandelen": ["Sales manager", "Inkoopmanager", "Accountmanager"],
  "Creatief": ["Art director", "UX designer", "Marketingmanager"],
  "Probleemoplossend": ["Solution architect", "Consultant", "Business analist"],
  "Organiseren / plannen": ["Projectmanager", "Operationeel manager", "Planner"],
  "Zelfstandig": ["Consultant", "Accountmanager", "Projectmanager"],
  "Samenwerken": ["Projectmanager", "Scrum master", "Teamleider"],
  "Presenteren": ["Consultant", "Sales manager", "Trainer"],
  "Stressbestendig": ["Operationeel manager", "Projectmanager", "Teamleider"],
  "Nauwkeurig": ["Controller", "Auditor", "Kwaliteitsmanager"],
  "Strategisch denken": ["Directeur", "Strategy consultant", "Productmanager"],
  "Ondernemend": ["Business developer", "Sales manager", "Productmanager"],
  "Empathisch": ["Psycholoog", "HR-adviseur", "Maatschappelijk werker"],
  "Overtuigingskracht": ["Sales manager", "Accountmanager", "Business developer"],

  // Programmeren & IT
  "Python": ["Machine learning engineer", "Data scientist", "Data engineer", "Backend developer"],
  "Java": ["Software architect", "Backend developer", "Java developer"],
  "C#": ["Software architect", ".NET developer", "Backend developer"],
  "C++": ["Embedded software engineer", "Software engineer", "Game developer"],
  "C": ["Embedded software engineer", "Firmware engineer", "Software engineer"],
  "JavaScript": ["Full-stack developer", "Frontend developer", "Webdeveloper"],
  "TypeScript": ["Full-stack developer", "Frontend developer", "Backend developer"],
  "Go": ["Platform engineer", "Backend developer", "Site reliability engineer"],
  "Rust": ["Systems engineer", "Backend developer", "Embedded software engineer"],
  "PHP": ["Backend developer", "Full-stack developer", "Webdeveloper"],
  "Ruby": ["Backend developer", "Full-stack developer"],
  "Kotlin": ["Android developer", "Backend developer", "Mobile developer"],
  "Swift": ["iOS developer", "Mobile developer"],
  "R": ["Data scientist", "Statisticus", "Data analist"],
  "SQL": ["Data engineer", "Database administrator", "BI-specialist", "Data analist"],
  "Scala": ["Data engineer", "Backend developer"],
  "React": ["Frontend developer", "Full-stack developer"],
  "Angular": ["Frontend developer", "Full-stack developer"],
  ".NET": ["Software architect", ".NET developer", "Backend developer"],
  "Node.js": ["Backend developer", "Full-stack developer"],
  "SAP": ["SAP consultant", "ERP-consultant", "Functioneel beheerder"],
  "Salesforce": ["Salesforce consultant", "CRM-specialist", "Functioneel beheerder"],
  "Power BI": ["BI-specialist", "Data analist", "Controller"],
  "Tableau": ["BI-specialist", "Data analist"],
  "Excel (gevorderd)": ["Controller", "Financieel analist", "Business analist"],
  "VBA": ["Financieel analist", "Business analist", "Data analist"],
  "AWS": ["Cloud architect", "DevOps engineer", "Cloud engineer"],
  "Azure": ["Cloud architect", "DevOps engineer", "Cloud engineer"],
  "Google Cloud": ["Cloud architect", "Cloud engineer", "Data engineer"],
  "Kubernetes": ["Platform engineer", "DevOps engineer", "Site reliability engineer"],
  "Docker": ["DevOps engineer", "Platform engineer", "Backend developer"],
  "DevOps / CI/CD": ["DevOps engineer", "Platform engineer", "Site reliability engineer"],
  "Linux": ["Site reliability engineer", "Linux beheerder", "Systeembeheerder"],
  "Netwerkbeheer": ["Netwerkarchitect", "Netwerkengineer", "Netwerkbeheerder"],
  "Informatiebeveiliging": ["CISO", "Security architect", "Security officer", "Security engineer"],
  "Machine learning / AI": ["Machine learning engineer", "Data scientist", "AI engineer"],
  "Data engineering": ["Data architect", "Data engineer", "BI-specialist"],
  "UX/UI-design": ["Product designer", "UX designer", "UI designer"],
  "Testen / QA": ["Test automation engineer", "Test manager", "Tester"],
  "Scrum / Agile": ["Agile coach", "Product owner", "Scrum master"],

  // Financieel & juridisch
  "CFA": ["Portfoliomanager", "Investment analist", "Financieel analist"],
  "RA": ["Partner accountantskantoor", "Registeraccountant", "Auditor"],
  "AA": ["Accountant", "Controller", "Financieel manager"],
  "RC": ["CFO", "Financieel manager", "Controller"],
  "ACCA": ["Financieel manager", "Controller", "Accountant"],
  "FRM": ["Risicomanager", "Risk analist", "Treasurer"],
  "CPA": ["Financieel manager", "Controller", "Accountant"],
  "Boekhouden": ["Financieel manager", "Controller", "Boekhouder"],
  "Controlling": ["CFO", "Financieel manager", "Business controller", "Controller"],
  "Fiscaal recht": ["Belastingadviseur", "Fiscalist", "Fiscaal jurist"],
  "Belastingadvies": ["Belastingadviseur", "Fiscalist"],
  "Risicomanagement": ["Risicomanager", "Risk analist", "Compliance officer"],
  "Compliance": ["Compliance manager", "Compliance officer", "Risicomanager"],
  "Audit": ["Auditmanager", "IT-auditor", "Auditor"],
  "Treasury": ["Treasurer", "Treasury analist"],
  "Actuarieel": ["Actuaris", "Risk analist"],
  "Financiële modellering": ["Corporate finance adviseur", "Investment analist", "Financieel analist"],
  "IFRS": ["Financieel manager", "Controller", "Accountant"],
  "Juridisch advies": ["Advocaat", "Bedrijfsjurist", "Juridisch adviseur"],
  "Contractenrecht": ["Advocaat", "Bedrijfsjurist", "Contractmanager"],
  "Arbeidsrecht": ["Advocaat", "HR-manager", "Arbeidsrechtjurist"],
  "Privacy / AVG": ["Privacy officer", "Functionaris gegevensbescherming", "Privacyjurist"],

  // Financiële dienstverlening (Wft)
  "Wft Basis": ["Financieel adviseur", "Klantadviseur", "Medewerker binnendienst"],
  "Wft Schade": ["Schadeadviseur", "Acceptant", "Schadebehandelaar"],
  "Wft Vermogen": ["Private banker", "Vermogensbeheerder", "Beleggingsadviseur"],
  "Wft Hypothecaire krediet": ["Hypotheekadviseur", "Financieel adviseur"],
  "Wft Pensioen": ["Pensioenadviseur", "Financieel planner"],
  "Wft Consumptief krediet": ["Kredietadviseur", "Financieel adviseur"],
  "Wft Zorgverzekeringen": ["Verzekeringsadviseur", "Klantadviseur"],
  "Wft Inkomen": ["Inkomensadviseur", "Verzekeringsadviseur"],
  "Hypotheekadvies": ["Hypotheekadviseur", "Financieel adviseur"],
  "Beleggingsadvies": ["Private banker", "Vermogensbeheerder", "Beleggingsadviseur"],
  "Kredietanalyse": ["Kredietrisicomanager", "Kredietanalist", "Accountmanager zakelijk"],
  "KYC / AML": ["Compliance officer", "AML-analist", "KYC-analist"],

  // Management & bedrijfsvoering
  "Projectmanagement": ["Programmamanager", "Projectmanager", "Projectleider"],
  "Prince2": ["Programmamanager", "Projectmanager", "Projectleider"],
  "PMP": ["Programmamanager", "Projectmanager"],
  "IPMA": ["Programmamanager", "Projectmanager", "Projectleider"],
  "Lean / Six Sigma": ["Operations manager", "Procesmanager", "Lean specialist"],
  "ITIL": ["IT-servicemanager", "IT-manager", "Servicedeskmanager"],
  "Procesverbetering": ["Procesmanager", "Business consultant", "Procesanalist"],
  "Change management": ["Change manager", "Organisatieadviseur", "Interim manager"],
  "Productmanagement": ["Head of product", "Productmanager", "Product owner"],
  "Inkoop": ["Inkoopmanager", "Category manager", "Inkoper"],
  "Supply chain": ["Supply chain manager", "Logistiek manager", "Demand planner"],
  "Accountmanagement": ["Key accountmanager", "Accountmanager"],
  "Marketing": ["Marketingdirecteur", "Marketingmanager", "Marketeer"],
  "Online marketing / SEO": ["Growth marketeer", "Online marketeer", "SEO-specialist"],
  "Content / copywriting": ["Contentmanager", "Copywriter", "Contentmarketeer"],
  "HR / recruitment": ["HR-manager", "HR business partner", "Recruiter"],
  "Beleidsadvies": ["Senior beleidsadviseur", "Beleidsadviseur", "Beleidsmedewerker"],
  "Kwaliteitsmanagement (ISO)": ["Kwaliteitsmanager", "QHSE-manager", "Kwaliteitsfunctionaris"],

  // Zorg & onderwijs
  "BIG-registratie": ["Medisch specialist", "Huisarts", "Verpleegkundig specialist"],
  "Verpleegkunde": ["Verpleegkundig specialist", "Teamleider zorg", "Verpleegkundige"],
  "Medische kennis": ["Medisch adviseur", "Medical science liaison", "Arts"],
  "Farmacie": ["Apotheker", "Regulatory affairs specialist", "Apothekersassistent"],
  "Psychologie": ["GZ-psycholoog", "Psycholoog", "Arbeids- en organisatiepsycholoog"],
  "Fysiotherapie": ["Praktijkhouder fysiotherapie", "Fysiotherapeut"],
  "Begeleiden": ["Teamleider zorg", "Gedragsdeskundige", "Begeleider"],
  "Lesgeven / didactiek": ["Docent hbo", "Trainer", "Leraar"],
  "Lesbevoegdheid": ["Schoolleider", "Docent hbo", "Leraar"],
  "Jeugdzorg": ["Gedragswetenschapper", "Jeugdzorgwerker", "Gezinsvoogd"],
  "EHBO / BHV": ["Preventiemedewerker", "Veiligheidskundige", "Facilitair medewerker"],

  // Techniek & vakmanschap
  "Werktuigbouwkunde": ["Engineering manager", "Werktuigbouwkundig ingenieur", "Constructeur"],
  "Elektrotechniek": ["Elektrotechnisch ingenieur", "Engineer", "Elektromonteur"],
  "Installatietechniek": ["Installatieadviseur", "Projectleider installatietechniek", "Servicemonteur"],
  "Bouwkunde": ["Projectmanager bouw", "Bouwkundig ingenieur", "Werkvoorbereider"],
  "CAD / BIM": ["BIM-manager", "BIM-modelleur", "Tekenaar"],
  "PLC-programmeren": ["Automation engineer", "PLC-programmeur", "Service engineer"],
  "Lassen": ["Lasinspecteur", "Lasser"],
  "Onderhoud / monteur": ["Maintenance engineer", "Service engineer", "Monteur"],
  "VCA": ["HSE-manager", "Uitvoerder", "Monteur"],
  "NEN 3140": ["Installatieverantwoordelijke", "Elektromonteur", "Service engineer"],
  "Rijbewijs C/CE": ["Planner transport", "Vrachtwagenchauffeur"],
  "Heftruckcertificaat": ["Teamleider logistiek", "Magazijnmedewerker"],
  "Logistiek / planning": ["Logistiek manager", "Supply chain planner", "Planner"],
  "Laboratorium": ["Labmanager", "Onderzoeker", "Analist laboratorium"],
  "Chemie": ["Procestechnoloog", "Chemicus", "Analist laboratorium"],

  // Talen
  "Engels": ["International accountmanager", "Consultant", "Vertaler"],
  "Duits": ["Export manager", "International accountmanager", "Vertaler"],
  "Frans": ["Export manager", "International accountmanager", "Vertaler"],
  "Spaans": ["Export manager", "International accountmanager", "Vertaler"],
  "Chinees": ["Export manager", "International accountmanager", "Tolk"],
  "Arabisch": ["International accountmanager", "Tolk", "Vertaler"],
  "Turks": ["International accountmanager", "Tolk", "Vertaler"],
  "Pools": ["International accountmanager", "Teamleider logistiek", "Tolk"],
  "Nederlands als tweede taal": ["Docent NT2", "Taalcoach"],
};

export type Kandidaat = { functie: string; functie_key: string; gedeeld: string[]; besteRang: number };

/**
 * Kandidaat-functies voor de gekozen vaardigheden, zonder de eigen functie.
 * gedeeld = welke van jouw vaardigheden naar deze functie wijzen;
 * besteRang = beste positie in een lijst (0 = best betaald bij die vaardigheid).
 */
export function kandidaatFuncties(vaardigheden: string[], eigenFunctieKey: string | null): Kandidaat[] {
  const map = new Map<string, Kandidaat>();
  for (const v of vaardigheden) {
    const lijst = (FUNCTIES_PER_VAARDIGHEID as Record<string, readonly string[]>)[v] ?? [];
    lijst.forEach((functie, rang) => {
      const key = functieKey(functie);
      if (key === eigenFunctieKey) return;
      const k = map.get(key) ?? { functie, functie_key: key, gedeeld: [], besteRang: rang };
      if (!k.gedeeld.includes(v)) k.gedeeld.push(v);
      k.besteRang = Math.min(k.besteRang, rang);
      map.set(key, k);
    });
  }
  return [...map.values()];
}

export type FallbackFunctie = { functie: string; functie_key: string; gedeeld: string[]; p50: number | null; n: number | null };

/**
 * Rangschikt kandidaten: eerst functies waarvan we een mediaan hebben (hoog → laag),
 * daarna de rest op aantal gedeelde vaardigheden en positie in de lijst.
 */
export function rangschikFallback(kandidaten: Kandidaat[], medianen: Map<string, { n: number; p50: number }>, limit: number): FallbackFunctie[] {
  return kandidaten
    .map((k) => ({ ...k, p50: medianen.get(k.functie_key)?.p50 ?? null, n: medianen.get(k.functie_key)?.n ?? null }))
    .sort((a, b) =>
      (a.p50 == null ? 1 : 0) - (b.p50 == null ? 1 : 0) ||
      (b.p50 ?? 0) - (a.p50 ?? 0) ||
      b.gedeeld.length - a.gedeeld.length ||
      a.besteRang - b.besteRang)
    .slice(0, limit)
    .map(({ functie, functie_key, gedeeld, p50, n }) => ({ functie, functie_key, gedeeld, p50, n }));
}
