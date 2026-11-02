import { describe, expect, it } from "vitest";
import { cascade, type PeerKey } from "@/lib/cascade";

const k = { functie_key: "data analist", sector: "ICT", provincie: "Utrecht", ervaringsband: "5-10" };
const dims = (key: PeerKey) => (Object.keys(key) as (keyof PeerKey)[]).filter((d) => key[d] != null);

describe("cascade", () => {
  const steps = cascade(k);

  it("begint met de volledige key en eindigt met alle salarissen", () => {
    expect(steps[0].key).toEqual(k);
    expect(dims(steps.at(-1)!.key)).toEqual([]);
  });

  it("is na de eerste stap altijd breder dan de meest specifieke groep", () => {
    for (const s of steps.slice(1)) {
      const d = dims(s.key);
      expect(d.length).toBeLessThan(4);
      for (const dim of d) expect(s.key[dim]).toBe(k[dim]);
    }
  });

  it("heeft unieke niveaus", () => {
    expect(new Set(steps.map((s) => JSON.stringify(s.key))).size).toBe(steps.length);
    expect(new Set(steps.map((s) => s.level)).size).toBe(steps.length);
  });
});
