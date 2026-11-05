import { describe, it, expect } from "vitest";
import { FUNCTIES_PER_VAARDIGHEID, kandidaatFuncties, rangschikFallback } from "@/lib/functieSuggesties";
import { VAARDIGHEDEN } from "@/lib/vaardigheden";

describe("functiesuggesties (fallback)", () => {
  it("heeft voor elke vaardigheid minstens twee functies", () => {
    for (const v of VAARDIGHEDEN) expect((FUNCTIES_PER_VAARDIGHEID as Record<string, readonly string[]>)[v]?.length ?? 0).toBeGreaterThanOrEqual(2);
  });
  it("voegt dubbele functies samen en sluit de eigen functie uit", () => {
    const k = kandidaatFuncties(["Python", "SQL"], "data scientist");
    expect(k.find((x) => x.functie_key === "data scientist")).toBeUndefined();
    expect(k.find((x) => x.functie_key === "data engineer")?.gedeeld).toEqual(["Python", "SQL"]);
  });
  it("rangschikt functies met mediaan eerst, hoog naar laag", () => {
    const k = kandidaatFuncties(["Python", "SQL"], null);
    const r = rangschikFallback(k, new Map([["data analist", { n: 20, p50: 4000 }], ["backend developer", { n: 15, p50: 5500 }]]), 3);
    expect(r.map((x) => x.functie_key)).toEqual(["backend developer", "data analist", "data engineer"]);
    expect(r[2].p50).toBeNull();
  });
});
