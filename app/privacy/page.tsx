import Prose from "@/components/Prose";

export const metadata = { title: "Privacyverklaring – VergelijkMijnSalaris" };

// LET OP: concept. Laat dit vóór livegang toetsen door een privacyjurist en vul de [placeholders] in.
export default function Page() {
  return (
    <Prose>
      <h1>Privacyverklaring</h1>
      <p><em>Laatst bijgewerkt: [datum]</em></p>
      <p>
        VergelijkMijnSalaris ([bedrijfsnaam], KvK [nummer], [adres], <a href="mailto:privacy@vergelijkmijnsalaris.nl">privacy@vergelijkmijnsalaris.nl</a>)
        is verwerkingsverantwoordelijke. Privacy is het uitgangspunt van deze dienst: we willen zo weinig mogelijk over je weten.
      </p>

      <h2>In het kort</h2>
      <ul>
        <li>Je hebt geen account nodig. We vragen geen naam, e-mailadres of telefoonnummer.</li>
        <li>Je schermt je BSN en IBAN af in je eigen browser. Dat is verplicht en wordt automatisch gecontroleerd. Een originele PDF verlaat je apparaat nooit.</li>
        <li>De afgeschermde afbeelding wordt eenmalig door een AI-model in de EU geanalyseerd en daarna direct weggegooid. We slaan je strook nergens op.</li>
        <li>We bewaren alleen geanonimiseerde salarisgegevens, zoals functie, sector, provincie, leeftijdscategorie en salaris. Die zijn niet tot jou te herleiden.</li>
        <li>Vergelijkingen tonen we alleen voor groepen van minimaal 10 personen.</li>
      </ul>

      <h2>Welke gegevens verwerken we?</h2>
      <table>
        <thead><tr><th>Gegeven</th><th>Doel</th><th>Bewaartermijn</th></tr></thead>
        <tbody>
          <tr><td>Afgeschermde afbeelding van je salarisstrook</td><td>Uitlezen en echtheidscontrole</td><td>Niet opgeslagen. Alleen tijdens de analyse in het werkgeheugen (enkele seconden).</td></tr>
          <tr><td>Functie, sector, provincie, leeftijdscategorie, ervaringscategorie, opleidingsniveau, uren, bruto salaris, arbeidsvoorwaarden, jaar</td><td>Salarisvergelijking en statistieken</td><td>Maximaal 3 jaar, of tot je de gegevens verwijdert</td></tr>
          <tr><td>Hash (vingerafdruk) van de afgeschermde afbeelding</td><td>Voorkomen dat dezelfde strook vaker wordt ingediend</td><td>Gelijk aan de inzending</td></tr>
          <tr><td>Gehasht IP-adres met dagelijks wisselende sleutel</td><td>Misbruik voorkomen (rate limiting)</td><td>24 uur</td></tr>
        </tbody>
      </table>
      <p>
        We verwerken <strong>geen</strong> BSN, IBAN, naam, adres, geboortedatum of werkgeversnaam. Als er na je eigen afscherming toch een BSN of IBAN
        leesbaar is, weigert ons systeem de analyse en wordt er niets bewaard.
      </p>

      <h2>Grondslag</h2>
      <p>
        We verwerken je gegevens op basis van je uitdrukkelijke toestemming (art. 6 lid 1 sub a AVG). Die geef je bij het uploaden. Je kunt je toestemming
        altijd intrekken door je gegevens te verwijderen via je resultaatlink.
      </p>

      <h2>Verwerkers</h2>
      <p>We werken met de volgende verwerkers. Met allemaal is een verwerkersovereenkomst gesloten en de verwerking vindt plaats in de EU:</p>
      <ul>
        <li>Mistral AI (Frankrijk, verwerking in de EU): AI-analyse. Met zero data retention bewaart Mistral je invoer niet en gebruikt die niet voor training.</li>
        <li>Vercel (Frankfurt): hosting van de website.</li>
        <li>Supabase (Frankfurt): database met geanonimiseerde salarisgegevens.</li>
        <li>[Upstash (EU): rate limiting]</li>
      </ul>
      <p>
        Een aantal van deze partijen is Amerikaans. Doorgifte buiten de EU is in de basis niet nodig. Voor eventuele toegang vanuit de VS gelden het EU-US Data Privacy
        Framework en standaardcontractbepalingen.
      </p>

      <h2>Geautomatiseerde beoordeling</h2>
      <p>
        Een AI-model beoordeelt of je upload een echte salarisstrook is. Wordt je strook afgewezen, dan heeft dat geen rechtsgevolgen: je kunt het opnieuw proberen of
        contact met ons opnemen.
      </p>

      <h2>Je rechten</h2>
      <p>
        Je hebt recht op inzage, correctie, verwijdering, beperking en bezwaar. Omdat we geen identificerende gegevens hebben, kunnen we je inzending alleen
        terugvinden via je persoonlijke resultaatlink. Daarop staat ook de knop om je gegevens direct te verwijderen. Je kunt ook een klacht indienen bij de{" "}
        <a href="https://autoriteitpersoonsgegevens.nl" rel="noopener">Autoriteit Persoonsgegevens</a>.
      </p>

      <h2>Beveiliging</h2>
      <ul>
        <li>Versleutelde verbindingen (HTTPS/HSTS) en een strikte Content Security Policy.</li>
        <li>De database is alleen toegankelijk voor onze server en niet direct vanuit de browser.</li>
        <li>Geen tracking- of advertentiecookies en geen scripts van derden.</li>
      </ul>
    </Prose>
  );
}
