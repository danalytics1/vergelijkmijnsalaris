export type PeerKey = { functie_key: string | null; sector: string | null; provincie: string | null; ervaringsband: string | null };

export type CascadeStep = { level: string; key: PeerKey };

/**
 * Steeds bredere peergroepen; de eerste met k >= 10 wordt gebruikt.
 * De laatste stap (alles null) is het vangnet: alle salarissen in de database.
 */
export function cascade(k: Required<{ [K in keyof PeerKey]: string }>): CascadeStep[] {
  const none: PeerKey = { functie_key: null, sector: null, provincie: null, ervaringsband: null };
  return [
    { level: "dezelfde functie, sector, provincie en ervaring", key: { ...k } },
    { level: "dezelfde functie, sector en ervaring (heel NL)", key: { ...k, provincie: null } },
    { level: "dezelfde functie en sector", key: { ...k, provincie: null, ervaringsband: null } },
    { level: "dezelfde functie en ervaring (alle sectoren)", key: { ...none, functie_key: k.functie_key, ervaringsband: k.ervaringsband } },
    { level: "dezelfde functie (alle sectoren)", key: { ...none, functie_key: k.functie_key } },
    { level: "dezelfde sector en ervaring (alle functies)", key: { ...none, sector: k.sector, ervaringsband: k.ervaringsband } },
    { level: "dezelfde sector (alle functies)", key: { ...none, sector: k.sector } },
    { level: "alle salarissen in Nederland", key: { ...none } },
  ];
}
