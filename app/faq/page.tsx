import Prose from "@/components/Prose";
export const metadata = { title: "Veelgestelde vragen – VergelijkMijnSalaris" };

const FAQ = [
  ["Waarom moet ik een salarisstrook uploaden?", "Zo weten we zeker dat we met echte salarissen vergelijken. Zelf ingevulde bedragen zijn vaak onbetrouwbaar."],
  ["Slaan jullie persoonsgegevens op?", "Nee. We vragen en bewaren geen naam, adres, e-mailadres, BSN, IBAN, geboortedatum of werkgever, en je hebt geen account nodig. We bewaren alleen anonieme salarisgegevens zoals functie, sector, provincie, leeftijds- en ervaringscategorie en je bruto salaris."],
  ["Wordt mijn salarisstrook opgeslagen?", "Nee. De afgeschermde afbeelding wordt alleen tijdens de analyse in het werkgeheugen gebruikt en daarna weggegooid."],
  ["Waarom moet ik mijn BSN en IBAN afschermen?", "Die gegevens hebben we niet nodig, en een BSN mag wettelijk alleen in bijzondere gevallen worden verwerkt. Daarom schermen we het af voordat er iets je apparaat verlaat."],
  ["Mijn strook wordt afgewezen, wat nu?", "Gebruik een scherpe, volledige afbeelding van een recente strook en laat de bedragen zichtbaar. Werkt het dan nog niet, neem dan contact met ons op."],
  ["Mag ik mijn gegevens aanpassen?", "Ja. Kleine correcties zijn geen probleem. Wijkt je bruto salaris meer dan 5% af van je strook, dan krijg je wel een vergelijking, maar tellen je gegevens niet mee in de statistieken."],
  ["Hoe verwijder ik mijn gegevens?", "Via de knop op je persoonlijke resultaatpagina. Bewaar die link dus goed."],
  ["Waarom zie ik geen vergelijking?", "We tonen alleen groepen van minimaal 10 salarissen. Zo is niemand te herleiden. Is je groep te klein, dan vergelijken we met een bredere groep."],
];

export default function Page() {
  return (
    <Prose>
      <h1>Veelgestelde vragen</h1>
      {FAQ.map(([q, a]) => (
        <details key={q} className="card !p-4">
          <summary className="font-semibold cursor-pointer text-fg">{q}</summary>
          <p className="mt-2">{a}</p>
        </details>
      ))}
    </Prose>
  );
}
