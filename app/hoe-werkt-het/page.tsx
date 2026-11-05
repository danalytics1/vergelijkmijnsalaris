import Link from "next/link";
import Prose from "@/components/Prose";
import { llmInfo } from "@/lib/llm/provider";
export const metadata = { title: "Hoe werkt het – VergelijkMijnSalaris" };
export default function Page() {
  return (
    <Prose>
      <h1>Hoe werkt het?</h1>
      <h2>1. Upload je salarisstrook</h2>
      <p>Upload een PDF of een screenshot van een recente salarisstrook, maximaal 18 maanden oud. Een PDF wordt in je browser omgezet naar een afbeelding. Het originele bestand wordt nooit verstuurd.</p>
      <h2>2. Scherm je BSN en IBAN af (verplicht)</h2>
      <p>
        Je trekt zwarte balken over je BSN en IBAN. Daarna controleert je browser met tekstherkenning of er nog een BSN of IBAN leesbaar is. Dat gebeurt op je
        eigen apparaat. Pas als er niets meer leesbaar is, kun je verder. Je kunt ook meteen een screenshot uploaden waarop je BSN en IBAN niet staan.
      </p>
      <h2>3. AI leest je strook uit</h2>
      <p>
        Een AI-model {llmInfo().euOnly ? "in de EU" : "van Anthropic (Verenigde Staten)"} leest de salarisgegevens uit en controleert of het om een echte strook gaat. Het kijkt daarbij onder andere of bruto, inhoudingen en
        netto met elkaar kloppen en of de loonheffing plausibel is. Het model geeft nooit je naam, adres of werkgever terug.
      </p>
      <h2>4. Controleer en vergelijk</h2>
      <p>
        Je ziet een ingevuld formulier en kunt dat aanpassen. Daarna vergelijken we je salaris, omgerekend naar 40 uur, met mensen in dezelfde functie, sector,
        regio en ervaringscategorie.
      </p>
      <Link href="/vergelijk" className="btn-primary !no-underline !text-ink">Start de vergelijking</Link>
    </Prose>
  );
}
